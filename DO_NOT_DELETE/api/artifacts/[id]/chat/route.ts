import { NextRequest, NextResponse } from 'next/server'
import { ARTIFACT_CONTEXT_PROMPT } from '@/lib/artifact-system-prompts'
import { parseArtifactResponse } from '@/lib/artifact-parser'
import { MCP_TOOLS, executeMCPTool } from '@/lib/mcp-tools'
import { createGroqClient } from '@/lib/groq'
import { getEffectiveApiKey } from '@/lib/get-api-key'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatRequest {
  message: string
  files: Record<string, string>
  history: ChatMessage[]
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: artifactId } = await params
    const body: ChatRequest = await request.json()
    const { message, files, history } = body

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Build conversation history with code context
    const contextPrompt = ARTIFACT_CONTEXT_PROMPT(
      files,
      `Artifact ${artifactId}`
    )

    const messages: any[] = [
      {
        role: 'system',
        content: contextPrompt,
      },
      // Include previous conversation
      ...history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      // Add new user message
      {
        role: 'user',
        content: message,
      },
    ]

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Get user-specific API key (or fall back to global)
          const apiKey = await getEffectiveApiKey()
          const groqClient = createGroqClient(apiKey)

          const completion = await groqClient.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages,
            temperature: 0.7,
            max_tokens: 4096,
            stream: true,
            tools: MCP_TOOLS,
            tool_choice: 'auto',
          })

          let fullContent = ''
          let toolCalls: any[] = []
          const fileChanges: Record<string, string> = { ...files }

          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta

            // Handle text content
            if (delta?.content) {
              fullContent += delta.content
              const data = JSON.stringify({ content: delta.content, done: false })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }

            // Handle tool calls
            if (delta?.tool_calls) {
              for (const toolCall of delta.tool_calls) {
                const index = toolCall.index

                // Initialize tool call entry if needed
                if (!toolCalls[index]) {
                  toolCalls[index] = {
                    id: toolCall.id || '',
                    type: 'function',
                    function: {
                      name: toolCall.function?.name || '',
                      arguments: '',
                    },
                  }
                }

                // Accumulate function arguments
                if (toolCall.function?.arguments) {
                  toolCalls[index].function.arguments += toolCall.function.arguments
                }

                // Update ID if provided
                if (toolCall.id) {
                  toolCalls[index].id = toolCall.id
                }

                // Update name if provided
                if (toolCall.function?.name) {
                  toolCalls[index].function.name = toolCall.function.name
                }
              }
            }
          }

          // Execute tool calls if any
          if (toolCalls.length > 0) {
            for (const toolCall of toolCalls) {
              try {
                const { name, arguments: argsStr } = toolCall.function
                const args = JSON.parse(argsStr)

                // Execute the MCP tool
                const result = await executeMCPTool(artifactId, name, args)

                // Update file changes based on tool execution
                if (name === 'write_file' && !result.startsWith('Error:')) {
                  // Read the file back to update fileChanges
                  const readResult = await executeMCPTool(artifactId, 'read_file', {
                    path: args.path,
                  })
                  if (!readResult.startsWith('Error:')) {
                    fileChanges[args.path] = readResult
                  }
                } else if (name === 'edit_file' && !result.startsWith('Error:')) {
                  // Read the file back to update fileChanges
                  const readResult = await executeMCPTool(artifactId, 'read_file', {
                    path: args.path,
                  })
                  if (!readResult.startsWith('Error:')) {
                    fileChanges[args.path] = readResult
                  }
                } else if (name === 'delete_file' && !result.startsWith('Error:')) {
                  delete fileChanges[args.path]
                }

                // Stream tool execution notification to user
                const toolData = JSON.stringify({
                  content: `\n\n*[Tool: ${name} - ${result}]*\n\n`,
                  done: false,
                })
                controller.enqueue(encoder.encode(`data: ${toolData}\n\n`))
              } catch (error: any) {
                console.error('Tool execution error:', error)
                const errorData = JSON.stringify({
                  content: `\n\n*[Tool error: ${error.message}]*\n\n`,
                  done: false,
                })
                controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
              }
            }
          }

          // Fallback: Parse XML if no tool calls (backward compatibility)
          let xmlFileChanges: Record<string, string> | undefined = undefined
          if (toolCalls.length === 0 && fullContent) {
            const artifactResponse = parseArtifactResponse(fullContent)
            if (
              artifactResponse?.type === 'modification' &&
              artifactResponse.modification
            ) {
              xmlFileChanges = applyEdits(files, artifactResponse.modification.edits)
            }
          }

          // Send final message with file changes
          const finalData = JSON.stringify({
            content: '',
            done: true,
            fileChanges: toolCalls.length > 0 ? fileChanges : xmlFileChanges,
          })
          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))

          controller.close()
        } catch (error: any) {
          console.error('Streaming error:', error)
          const errorData = JSON.stringify({
            error: error.message || 'Failed to generate response',
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
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Apply artifact edits to files
 */
function applyEdits(
  files: Record<string, string>,
  edits: any[]
): Record<string, string> {
  const newFiles = { ...files }

  for (const edit of edits) {
    const { path, action, location, content } = edit

    if (action === 'replace') {
      // Replace entire file
      newFiles[path] = content
    } else if (action === 'insert') {
      // Insert content at location
      const lines = (newFiles[path] || '').split('\n')

      if (location?.type === 'after-line' && location.line) {
        lines.splice(location.line, 0, content)
      } else if (location?.type === 'before-line' && location.line) {
        lines.splice(location.line - 1, 0, content)
      } else {
        // Append to end if no location specified
        lines.push(content)
      }

      newFiles[path] = lines.join('\n')
    } else if (action === 'modify') {
      // Modify specific lines
      const lines = (newFiles[path] || '').split('\n')

      if (
        location?.type === 'range' &&
        location.startLine &&
        location.endLine
      ) {
        // Replace lines in range
        const contentLines = content.split('\n')
        lines.splice(
          location.startLine - 1,
          location.endLine - location.startLine + 1,
          ...contentLines
        )
      } else if (location?.type === 'line' && location.line) {
        // Replace single line
        lines[location.line - 1] = content
      }

      newFiles[path] = lines.join('\n')
    } else if (action === 'delete') {
      // Delete lines or entire file
      if (!location) {
        // Delete entire file
        delete newFiles[path]
      } else if (
        location.type === 'range' &&
        location.startLine &&
        location.endLine
      ) {
        const lines = (newFiles[path] || '').split('\n')
        lines.splice(
          location.startLine - 1,
          location.endLine - location.startLine + 1
        )
        newFiles[path] = lines.join('\n')
      } else if (location.type === 'line' && location.line) {
        const lines = (newFiles[path] || '').split('\n')
        lines.splice(location.line - 1, 1)
        newFiles[path] = lines.join('\n')
      }
    }
  }

  return newFiles
}
