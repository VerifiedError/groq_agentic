import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { WORKSPACE_BUILDER_SYSTEM_PROMPT } from '@/lib/workspace-system-prompt'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

interface BuildRequest {
  request: string
  model?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: BuildRequest = await request.json()
    const { request: userRequest, model = 'llama-3.3-70b-versatile' } = body

    if (!userRequest || !userRequest.trim()) {
      return NextResponse.json(
        { error: 'Request is required' },
        { status: 400 }
      )
    }

    // Build the messages
    const messages: any[] = [
      {
        role: 'system',
        content: WORKSPACE_BUILDER_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Build this application:\n\n${userRequest}\n\nRemember to use the command format ([THOUGHT], [CREATE], [EDIT], [DELETE], [INSTALL], [COMPLETE]) and provide complete, working code.`,
      },
    ]

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await groq.chat.completions.create({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 8192,
            stream: true,
          })

          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content || ''
            if (delta) {
              const data = JSON.stringify({ content: delta, done: false })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }

          // Send final message
          const finalData = JSON.stringify({ content: '', done: true })
          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))

          controller.close()
        } catch (error: any) {
          console.error('Workspace build error:', error)
          const errorData = JSON.stringify({
            error: error.message || 'Failed to build workspace',
            done: true,
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Workspace API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
