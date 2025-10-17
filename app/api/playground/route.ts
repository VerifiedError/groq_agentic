import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Groq from 'groq-sdk'
import { GROQ_PRICING, calculateCost } from '@/lib/groq'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { model, messages, temperature, maxTokens, topP, stop } = body

    if (!model || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Missing required fields: model, messages' },
        { status: 400 }
      )
    }

    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Call Groq API with streaming
          const completion = await groq.chat.completions.create({
            model,
            messages,
            temperature: temperature ?? 1,
            max_tokens: maxTokens ?? 1024,
            top_p: topP ?? 1,
            stop: stop || undefined,
            stream: true,
          })

          let fullContent = ''
          let usage: any = null

          // Stream the response
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || ''
            fullContent += content

            // Check if we have usage info (comes in final chunk)
            if (chunk.x_groq?.usage) {
              usage = chunk.x_groq.usage
            }

            // Send chunk to client
            const data = {
              content,
              done: false,
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            )
          }

          // Calculate cost if we have usage data
          let cost = 0
          if (usage) {
            cost = calculateCost(
              model,
              usage.prompt_tokens || 0,
              usage.completion_tokens || 0
            )
          }

          // Send final message with usage and cost
          const finalData = {
            content: '',
            done: true,
            usage: usage || {
              prompt_tokens: 0,
              completion_tokens: 0,
              total_tokens: 0,
            },
            cost,
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`)
          )

          controller.close()
        } catch (error: any) {
          console.error('Streaming error:', error)
          const errorData = {
            error: error.message || 'Failed to generate response',
            done: true,
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`)
          )
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
    console.error('Playground API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
