/**
 * MCP Tool Definitions and Execution for Artifact Filesystem Operations
 *
 * Converts FastMCP filesystem tools to Groq SDK tool format and executes them.
 */

import { spawn } from 'child_process'
import path from 'path'

/**
 * Tool definitions in Groq SDK format
 */
export const MCP_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'read_file',
      description: 'Read the contents of a file in the artifact workspace',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative path to the file (e.g., "/app.py" or "components/Button.tsx")'
          }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'write_file',
      description: 'Write content to a file in the artifact workspace. Creates the file if it doesn\'t exist.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative path to the file (e.g., "/app.py")'
          },
          content: {
            type: 'string',
            description: 'Content to write to the file'
          }
        },
        required: ['path', 'content']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'edit_file',
      description: 'Edit a file by replacing old_text with new_text. Uses exact string matching.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative path to the file'
          },
          old_text: {
            type: 'string',
            description: 'Text to find and replace'
          },
          new_text: {
            type: 'string',
            description: 'Text to replace with'
          }
        },
        required: ['path', 'old_text', 'new_text']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_file',
      description: 'Delete a file from the artifact workspace',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative path to the file'
          }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_files',
      description: 'List all files in a directory of the artifact workspace',
      parameters: {
        type: 'object',
        properties: {
          directory: {
            type: 'string',
            description: 'Relative path to directory (default: "/")'
          }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_directory',
      description: 'Create a new directory in the artifact workspace',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative path to the new directory'
          }
        },
        required: ['path']
      }
    }
  }
]

/**
 * Execute an MCP tool by calling the Python FastMCP server
 */
export async function executeMCPTool(
  artifactId: string,
  toolName: string,
  args: Record<string, any>
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Path to MCP server
    const serverPath = path.join(process.cwd(), 'mcp_servers', 'filesystem_server.py')

    // Build Python command to call the tool
    const pythonCode = `
import sys
import json
sys.path.insert(0, '${path.join(process.cwd(), 'mcp_servers').replace(/\\/g, '\\\\')}')

from filesystem_server import ${toolName}

try:
    artifact_id = '${artifactId}'
    args = ${JSON.stringify(args)}

    # Call the tool function
    if '${toolName}' == 'read_file':
        result = read_file(artifact_id, args['path'])
    elif '${toolName}' == 'write_file':
        result = write_file(artifact_id, args['path'], args['content'])
    elif '${toolName}' == 'edit_file':
        result = edit_file(artifact_id, args['path'], args['old_text'], args['new_text'])
    elif '${toolName}' == 'delete_file':
        result = delete_file(artifact_id, args['path'])
    elif '${toolName}' == 'list_files':
        directory = args.get('directory', '/')
        result = list_files(artifact_id, directory)
    elif '${toolName}' == 'create_directory':
        result = create_directory(artifact_id, args['path'])
    else:
        result = f"Error: Unknown tool {tool_name}"

    print(result)
except Exception as e:
    print(f"Error executing tool: {str(e)}")
`

    // Execute Python
    const python = spawn('python', ['-c', pythonCode])

    let output = ''
    let error = ''

    python.stdout.on('data', (data) => {
      output += data.toString()
    })

    python.stderr.on('data', (data) => {
      error += data.toString()
    })

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Tool execution failed: ${error}`))
      } else {
        resolve(output.trim())
      }
    })

    // Timeout after 10 seconds
    setTimeout(() => {
      python.kill()
      reject(new Error('Tool execution timed out'))
    }, 10000)
  })
}
