import { NextRequest } from 'next/server'
import { createGroqClient } from '@/lib/groq'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimit, getRateLimitIdentifier, rateLimitConfigs } from '@/lib/rate-limit'
import { encode } from 'gpt-tokenizer'
import { calculateGroqCost, GroqModelName, isVisionModel } from '@/lib/groq'
import { parseToolCalls, calculateTotalToolCosts, type ToolUsage } from '@/lib/utils/groq-tool-costs'
import { getEffectiveApiKey } from '@/lib/get-api-key'

// Force dynamic rendering for streaming support
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/agentic - Groq Agentic System Endpoint
 *
 * This endpoint supports both Groq's Compound agentic systems and Vision models.
 *
 * Compound Models (built-in tools):
 * - groq/compound (production system)
 * - groq/compound-mini (lightweight system)
 *
 * Vision Models (image understanding):
 * - meta-llama/llama-4-scout-17b-16e-instruct
 * - meta-llama/llama-4-maverick-17b-128e-instruct
 * - llama-3.2-11b-vision-preview
 * - llama-3.2-90b-vision-preview
 * - llava-v1.5-7b-4096-preview
 */
export async function POST(request: NextRequest) {
  console.log('[Agentic] ========== NEW AGENTIC REQUEST ==========')
  console.log('[Agentic] Request received at:', new Date().toISOString())

  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log('[Agentic] Authentication failed - no user ID')
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401 }
      )
    }

    const userId = parseInt(session.user.id)

    // Apply rate limiting
    const identifier = getRateLimitIdentifier(request, session.user.id)
    const rateLimitResponse = await rateLimit(identifier, rateLimitConfigs.aiStream)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const body = await request.json()
    const {
      sessionId,
      message,
      settings = {},
      attachments = [],
    } = body

    if (!sessionId || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      )
    }

    // Fetch agentic session and verify ownership
    const agenticSession = await prisma.agenticSession.findFirst({
      where: {
        id: sessionId,
        userId: userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20, // Limit context window
        },
      },
    })

    if (!agenticSession) {
      return new Response(
        JSON.stringify({ error: 'Session not found or access denied' }),
        { status: 404 }
      )
    }

    // Use the session's model, not the request body
    const model = agenticSession.model

    // Validate that vision models are used with images
    const hasAttachments = attachments && attachments.length > 0
    const isUsingVisionModel = isVisionModel(model)

    if (hasAttachments && !isUsingVisionModel) {
      return new Response(
        JSON.stringify({
          error: 'Image attachments require a vision-capable model. Please select a vision model.'
        }),
        { status: 400 }
      )
    }

    // Validate attachments count (max 5 as per Groq API)
    if (hasAttachments && attachments.length > 5) {
      return new Response(
        JSON.stringify({
          error: 'Maximum 5 images per message allowed'
        }),
        { status: 400 }
      )
    }

    console.log('[Agentic] Request:', { sessionId, model })

    // Extract settings with defaults
    const {
      temperature = 0.7,
      maxTokens = 8192,
      topP = 1.0,
    } = settings

    // Build messages array
    const systemPrompt = isUsingVisionModel
      ? `You are a powerful AI assistant with vision capabilities. You can understand and analyze images provided by users.

Be concise, direct, and helpful. Format responses in markdown. When analyzing images, be detailed and accurate.`
      : `You are a powerful AI assistant with agentic capabilities powered by Groq Compound.

You have access to built-in tools for:
- Web search and browsing
- Code execution (Python, JavaScript, etc.)
- Browser automation
- Real-time data retrieval

Use these tools proactively when they would help answer the user's question. You don't need to ask permission - just use them when appropriate.

Be concise, direct, and helpful. Format responses in markdown.`

    const messages: any[] = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      ...agenticSession.messages.map((msg) => {
        // Reconstruct multi-modal messages from database
        if (msg.attachments) {
          try {
            const parsedAttachments = JSON.parse(msg.attachments)
            return {
              role: msg.role as 'user' | 'assistant' | 'system',
              content: [
                { type: 'text', text: msg.content },
                ...parsedAttachments.map((att: any) => ({
                  type: 'image_url',
                  image_url: {
                    url: att.data // base64 data URL
                  }
                }))
              ]
            }
          } catch (e) {
            // Fall back to text-only if parsing fails
            return {
              role: msg.role as 'user' | 'assistant' | 'system',
              content: msg.content,
            }
          }
        }
        return {
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        }
      }),
    ]

    // Build the current user message (with or without images)
    if (hasAttachments) {
      // Multi-modal message with text and images
      messages.push({
        role: 'user' as const,
        content: [
          { type: 'text', text: message },
          ...attachments.map((att: any) => ({
            type: 'image_url',
            image_url: {
              url: att.data // base64 data URL format: data:image/jpeg;base64,...
            }
          }))
        ]
      })
    } else {
      // Text-only message
      messages.push({ role: 'user' as const, content: message })
    }

    console.log('[Agentic] Model type:', isUsingVisionModel ? 'Vision' : 'Compound')
    console.log('[Agentic] Model (original):', model)
    console.log('[Agentic] Has attachments:', hasAttachments, attachments.length)

    // Transform model name: groq/compound -> compound-beta, groq/compound-mini -> compound-mini-beta
    // Groq API expects -beta suffix for Compound models only
    let groqModelName = model

    if (model.startsWith('groq/')) {
      groqModelName = model.replace('groq/', '')

      // Add -beta suffix for Compound models
      if (groqModelName === 'compound') {
        groqModelName = 'compound-beta'
      } else if (groqModelName === 'compound-mini') {
        groqModelName = 'compound-mini-beta'
      }
    }
    // Vision models use their full name as-is

    console.log('[Agentic] Model (transformed for Groq API):', groqModelName)
    console.log('[Agentic] Settings:', { temperature, maxTokens, topP })

    // Get user-specific API key (or fall back to global)
    const apiKey = await getEffectiveApiKey()
    const groqClient = createGroqClient(apiKey)

    // Create streaming response with Groq Compound
    const stream = await groqClient.chat.completions.create({
      model: groqModelName, // Use transformed model name (compound or compound-mini)
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stream: true,
    })

    // Track token usage and executed tools for cost calculation
    let promptTokens = 0
    let completionTokens = 0
    let cachedTokens = 0
    let fullResponse = ''
    let fullReasoning = '' // Track reasoning/thinking from models like DeepSeek-R1, Qwen, GPT-OSS
    let executedTools: any[] = []
    let usageBreakdown: any = null

    // Estimate prompt tokens (actual count will come from API)
    const promptText = messages.map(m => m.content).join('\n')
    promptTokens = encode(promptText).length

    // Create a ReadableStream to send data to client
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            // Log full chunk structure for debugging
            console.log('[Agentic] ========== CHUNK DEBUG ==========')
            console.log('[Agentic] Raw chunk:', JSON.stringify(chunk, null, 2))
            console.log('[Agentic] Chunk keys:', Object.keys(chunk))
            console.log('[Agentic] Chunk type:', typeof chunk)
            console.log('[Agentic] Has executed_tools?:', 'executed_tools' in chunk)
            console.log('[Agentic] Has x_groq?:', 'x_groq' in chunk)
            console.log('[Agentic] ====================================')

            const content = chunk.choices[0]?.delta?.content || ''
            const reasoning = chunk.choices[0]?.delta?.reasoning || ''

            // Accumulate content and reasoning
            if (content) {
              fullResponse += content
              completionTokens = encode(fullResponse).length
            }
            if (reasoning) {
              fullReasoning += reasoning
            }

            // Send chunk to client (include reasoning if present)
            if (content || reasoning) {
              const data: any = { content }
              if (reasoning) {
                data.reasoning = reasoning
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
            }

            // Check for finish reason
            if (chunk.choices[0]?.finish_reason) {
              console.log('[Agentic] Stream finished:', chunk.choices[0].finish_reason)

              // Get actual token usage if available
              const usage = (chunk as any).usage
              if (usage) {
                promptTokens = usage.prompt_tokens || promptTokens
                completionTokens = usage.completion_tokens || completionTokens
                cachedTokens = usage.prompt_tokens_details?.cached_tokens || 0
                console.log('[Agentic] Token usage from API:', usage)
                console.log('[Agentic] Cached tokens:', cachedTokens)
              }

              // Extract executed_tools from chunk (Groq Compound API specific)
              // CRITICAL: In streaming, executed_tools might be in choices[0].message.executed_tools
              console.log('[Agentic] Checking for executed_tools...')
              console.log('[Agentic] chunk.executed_tools:', chunk.executed_tools)
              console.log('[Agentic] chunk.choices[0]?.message?.executed_tools:', chunk.choices[0]?.message?.executed_tools)
              console.log('[Agentic] chunk.choices[0]?.delta?.executed_tools:', chunk.choices[0]?.delta?.executed_tools)

              if (chunk.executed_tools) {
                executedTools = chunk.executed_tools
                console.log('[Agentic] Found executed_tools at chunk level')
              } else if (chunk.choices[0]?.message?.executed_tools) {
                executedTools = chunk.choices[0].message.executed_tools
                console.log('[Agentic] Found executed_tools in message')
              } else if (chunk.choices[0]?.delta?.executed_tools) {
                executedTools = chunk.choices[0].delta.executed_tools
                console.log('[Agentic] Found executed_tools in delta')
              }

              if (executedTools.length > 0) {
                console.log('[Agentic] Executed tools:', JSON.stringify(executedTools, null, 2))
              } else {
                console.log('[Agentic] WARNING: No executed_tools found in any location!')
              }

              // Extract usage_breakdown if available
              if (chunk.usage_breakdown) {
                usageBreakdown = chunk.usage_breakdown
                console.log('[Agentic] Usage breakdown:', JSON.stringify(usageBreakdown, null, 2))
              }

              // Calculate token costs
              const tokenCosts = calculateGroqCost(
                model as GroqModelName,
                promptTokens,
                completionTokens
              )

              // Calculate tool costs from executed_tools
              const toolUsages: ToolUsage[] = parseToolCalls(executedTools)
              const { total: toolCost, breakdown: toolCostBreakdown } = calculateTotalToolCosts(toolUsages)

              // Total cost = token cost + tool cost
              const totalMessageCost = tokenCosts.totalCost + toolCost

              console.log('[Agentic] ========== COST BREAKDOWN ==========')
              console.log('[Agentic] Token costs:', tokenCosts.totalCost)
              console.log('[Agentic] Tool costs:', toolCost)
              console.log('[Agentic] Tool usages parsed:', toolUsages)
              console.log('[Agentic] Tool cost breakdown:', toolCostBreakdown)
              console.log('[Agentic] Total message cost:', totalMessageCost)
              console.log('[Agentic] ======================================')

              // Save user message to AgenticMessage
              await prisma.agenticMessage.create({
                data: {
                  sessionId,
                  role: 'user',
                  content: message,
                  cost: 0, // User messages don't have cost
                  inputTokens: 0,
                  outputTokens: 0,
                  cachedTokens: 0,
                  toolCalls: null,
                  attachments: hasAttachments ? JSON.stringify(attachments) : null,
                },
              })

              // Save assistant response to AgenticMessage (will update with tool costs later)
              const assistantMessage = await prisma.agenticMessage.create({
                data: {
                  sessionId,
                  role: 'assistant',
                  content: fullResponse,
                  cost: totalMessageCost,
                  inputTokens: promptTokens,
                  outputTokens: completionTokens,
                  cachedTokens: cachedTokens,
                  reasoning: fullReasoning || null, // Save reasoning from models like DeepSeek-R1, Qwen, GPT-OSS
                  toolCalls: executedTools.length > 0 ? JSON.stringify({
                    executed_tools: executedTools,
                    usages: toolUsages,
                    breakdown: toolCostBreakdown,
                  }) : null,
                },
              })

              console.log('[Agentic] Saved assistant message:', assistantMessage.id)

              // HYBRID APPROACH: Make a non-streaming call to get executed_tools
              // This is necessary because executed_tools is not available in streaming responses
              console.log('[Agentic] ========== FETCHING EXECUTED_TOOLS ==========')
              console.log('[Agentic] Making non-streaming call to retrieve tool metadata...')

              try {
                const metadataResponse = await groqClient.chat.completions.create({
                  model: groqModelName,
                  messages,
                  temperature,
                  max_tokens: maxTokens,
                  top_p: topP,
                  stream: false, // Non-streaming to get executed_tools
                })

                console.log('[Agentic] Metadata response received')
                console.log('[Agentic] Has executed_tools?:', !!metadataResponse.choices[0]?.message?.executed_tools)

                if (metadataResponse.choices[0]?.message?.executed_tools) {
                  const fetchedTools = metadataResponse.choices[0].message.executed_tools
                  console.log('[Agentic] Executed tools found:', JSON.stringify(fetchedTools, null, 2))

                  // Parse tool costs
                  const toolUsagesFromMetadata: ToolUsage[] = parseToolCalls(fetchedTools)
                  const { total: toolCostFromMetadata, breakdown: toolCostBreakdownFromMetadata } = calculateTotalToolCosts(toolUsagesFromMetadata)

                  // Recalculate total cost with tool costs
                  const totalCostWithTools = tokenCosts.totalCost + toolCostFromMetadata

                  console.log('[Agentic] Tool costs calculated:', toolCostFromMetadata)
                  console.log('[Agentic] Total cost with tools:', totalCostWithTools)

                  // Update assistant message with tool data
                  await prisma.agenticMessage.update({
                    where: { id: assistantMessage.id },
                    data: {
                      cost: totalCostWithTools,
                      toolCalls: JSON.stringify({
                        executed_tools: fetchedTools,
                        usages: toolUsagesFromMetadata,
                        breakdown: toolCostBreakdownFromMetadata,
                      }),
                    },
                  })

                  console.log('[Agentic] Updated message with tool costs')

                  // Update totalMessageCost for session update
                  const costDifference = toolCostFromMetadata

                  // Update session with additional tool costs
                  await prisma.agenticSession.update({
                    where: { id: sessionId },
                    data: {
                      totalCost: { increment: totalMessageCost + costDifference },
                      inputTokens: { increment: promptTokens },
                      outputTokens: { increment: completionTokens },
                      cachedTokens: { increment: cachedTokens },
                      messageCount: { increment: 2 },
                    },
                  })

                  console.log('[Agentic] Session updated with tool costs')
                } else {
                  console.log('[Agentic] No executed_tools in metadata response')

                  // Update session without tool costs
                  await prisma.agenticSession.update({
                    where: { id: sessionId },
                    data: {
                      totalCost: { increment: totalMessageCost },
                      inputTokens: { increment: promptTokens },
                      outputTokens: { increment: completionTokens },
                      cachedTokens: { increment: cachedTokens },
                      messageCount: { increment: 2 },
                    },
                  })
                }

                console.log('[Agentic] ===============================================')
              } catch (metadataError: any) {
                console.error('[Agentic] Failed to fetch executed_tools:', metadataError.message)

                // Fall back to updating session without tool costs
                await prisma.agenticSession.update({
                  where: { id: sessionId },
                  data: {
                    totalCost: { increment: totalMessageCost },
                    inputTokens: { increment: promptTokens },
                    outputTokens: { increment: completionTokens },
                    cachedTokens: { increment: cachedTokens },
                    messageCount: { increment: 2 },
                  },
                })
              }

              console.log('[Agentic] Saved messages and updated session')
              console.log('[Agentic] Tokens:', { promptTokens, completionTokens, cachedTokens })
              console.log('[Agentic] Total cost:', totalMessageCost)

              // Send final metadata (include reasoning if present)
              const finalData: any = {
                done: true,
                usage: {
                  promptTokens,
                  completionTokens,
                  cachedTokens,
                  totalTokens: promptTokens + completionTokens,
                  cost: totalMessageCost,
                  tokenCost: tokenCosts.totalCost,
                  toolCost: toolCost,
                }
              }
              if (fullReasoning) {
                finalData.reasoning = fullReasoning
              }
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify(finalData)}\n\n`
                )
              )
            }
          }

          controller.close()
        } catch (error: any) {
          console.error('[Agentic] Stream error:', error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: error.message || 'Stream failed' })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('[Agentic] Request error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { status: 500 }
    )
  }
}
