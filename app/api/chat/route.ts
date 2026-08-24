import { createClient } from '@/lib/supabase/server'
import { streamChat } from '@/lib/ai/provider'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
    })
  }

  const { message } = (await request.json()) as { message?: string }
  if (!message || !message.trim()) {
    return new Response(JSON.stringify({ error: 'Message is required' }), {
      status: 400,
    })
  }

  // Gather real context about this user so AIRA's replies are grounded
  const [{ data: profile }, { data: analysis }, { data: skillGaps }, { data: history }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, track')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('resume_analysis')
        .select('score, extracted_skills, strengths, improvements, summary')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('skill_gaps')
        .select('skill, importance')
        .eq('user_id', user.id),
      supabase
        .from('chat_messages')
        .select('role, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

  const name = profile?.full_name || user.email?.split('@')[0] || 'the user'

  let contextBlock = `The user's name is ${name}.`
  if (analysis) {
    contextBlock += `\nTheir resume score is ${analysis.score}/100. Summary: ${analysis.summary}`
    contextBlock += `\nTheir skills: ${(analysis.extracted_skills ?? []).join(', ') || 'none detected'}`
    contextBlock += `\nStrengths: ${(analysis.strengths ?? []).join('; ')}`
    contextBlock += `\nAreas to improve: ${(analysis.improvements ?? []).join('; ')}`
  } else {
    contextBlock += `\nThey have not uploaded/analyzed a resume yet — encourage them to do so on the Resume page for personalized help.`
  }
  if (skillGaps?.length) {
    contextBlock += `\nSkill gaps to work on: ${skillGaps.map((g) => `${g.skill} (${g.importance})`).join(', ')}`
  }

  const systemPrompt = `You are AIRA, a friendly and encouraging AI career copilot inside the PathPilot app, helping students find internships and grow their skills.
${contextBlock}
Keep replies conversational, concise (2-5 sentences unless asked for detail), and specific to this user's actual data above when relevant. Never invent facts about them that aren't given here.`

  // Build a simple conversation transcript (oldest first) for context
  const chronological = (history ?? []).slice().reverse()
  const transcript = chronological
    .map((m) => `${m.role === 'user' ? 'User' : 'AIRA'}: ${m.content}`)
    .join('\n')
  const prompt = `${transcript ? transcript + '\n' : ''}User: ${message}\nAIRA:`

  // Save the user's message right away
  await supabase
    .from('chat_messages')
    .insert({ user_id: user.id, role: 'user', content: message })

  let chunks: AsyncGenerator<string>
  try {
    chunks = await streamChat(prompt, systemPrompt)
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 502,
    })
  }

  let fullText = ''

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      try {
        for await (const chunk of chunks) {
          fullText += chunk
          controller.enqueue(encoder.encode(chunk))
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(`\n\n[Error: ${(err as Error).message}]`),
        )
      }

      if (fullText.trim()) {
        await supabase
          .from('chat_messages')
          .insert({ user_id: user.id, role: 'aira', content: fullText.trim() })
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
