import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Groq from 'groq-sdk'
import { GROQ_PRICING, calculateGroqCost } from '@/lib/groq'

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

    // Check if this is a TTS model
    const isTTSModel = model.includes('playai-tts') || model.includes('playai_tts')

    // Handle TTS models differently
    if (isTTSModel) {
      // For TTS, extract text from last user message
      const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()
      const textToSpeak = lastUserMessage?.content || ''

      try {
        const speech = await groq.audio.speech.create({
          model,
          voice: 'Fritz-PlayAI',
          input: textToSpeak,
          response_format: 'mp3'
        })

        // Convert audio buffer to base64
        const buffer = await speech.arrayBuffer()
        const base64Audio = Buffer.from(buffer).toString('base64')

        // Return as event stream for consistency
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            // Send audio data
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                content: '',
                audioData: `data:audio/mp3;base64,${base64Audio}`,
                done: true,
                usage: {
                  prompt_tokens: 0,
                  completion_tokens: Math.ceil(textToSpeak.length / 4),
                  total_tokens: Math.ceil(textToSpeak.length / 4),
                  cached_tokens: 0
                },
                cost: 0
              })}\n\n`)
            )
            controller.close()
          }
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        })
      } catch (error: any) {
        console.error('TTS error:', error)
        return NextResponse.json(
          { error: error.message || 'TTS generation failed' },
          { status: 500 }
        )
      }
    }

    // Create a streaming response for text models
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
            const costResult = calculateGroqCost(
              model,
              usage.prompt_tokens || 0,
              usage.completion_tokens || 0
            )
            cost = costResult.totalCost
          }

          // Send final message with usage and cost
          const finalData = {
            content: '',
            done: true,
            usage: usage ? {
              prompt_tokens: usage.prompt_tokens || 0,
              completion_tokens: usage.completion_tokens || 0,
              total_tokens: usage.total_tokens || 0,
              cached_tokens: usage.prompt_tokens_details?.cached_tokens || 0,
            } : {
              prompt_tokens: 0,
              completion_tokens: 0,
              total_tokens: 0,
              cached_tokens: 0,
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
