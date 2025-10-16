/**
 * Groq Tool Cost Calculator
 *
 * GPT-OSS Built-in Tools Pricing (2025):
 * - Browser Search - Basic Search: $5 / 1000 requests (browser_search - browser.search)
 * - Browser Search - Visit Website: $1 / 1000 requests (browser_search - browser.open)
 * - Code Execution - Python: $0.18 / hour (code_interpreter - python)
 */

export interface ToolUsage {
  tool: string
  action?: string // For browser_search: 'browser.search' or 'browser.open'
  count?: number // For request-based tools
  duration?: number // For time-based tools (in seconds)
}

export interface ToolCostBreakdown {
  tool: string
  action?: string
  count?: number
  duration?: number
  cost: number
}

// Pricing constants (in dollars)
const PRICING = {
  BROWSER_SEARCH: 5 / 1000, // $5 per 1000 requests (browser.search)
  BROWSER_OPEN: 1 / 1000, // $1 per 1000 requests (browser.open)
  CODE_INTERPRETER: 0.18 / 3600, // $0.18 per hour -> per second (python)
} as const

export function calculateToolCost(usage: ToolUsage): number {
  const toolKey = `${usage.tool}${usage.action ? '.' + usage.action : ''}`

  // Browser Search tool with different actions
  if (usage.tool === 'browser_search') {
    if (!usage.count) return 0

    if (usage.action === 'browser.search') {
      return usage.count * PRICING.BROWSER_SEARCH
    } else if (usage.action === 'browser.open') {
      return usage.count * PRICING.BROWSER_OPEN
    }

    // Default to search if action not specified
    return usage.count * PRICING.BROWSER_SEARCH
  }

  // Code Interpreter (Python execution)
  if (usage.tool === 'code_interpreter') {
    if (!usage.duration) return 0
    return usage.duration * PRICING.CODE_INTERPRETER
  }

  return 0
}

export function calculateTotalToolCosts(usageList: ToolUsage[]): {
  total: number
  breakdown: ToolCostBreakdown[]
} {
  const breakdown: ToolCostBreakdown[] = []
  let total = 0

  for (const usage of usageList) {
    const cost = calculateToolCost(usage)
    total += cost

    breakdown.push({
      tool: usage.tool,
      action: usage.action,
      count: usage.count,
      duration: usage.duration,
      cost,
    })
  }

  return { total, breakdown }
}

export function formatToolName(tool: string, action?: string): string {
  if (tool === 'browser_search') {
    if (action === 'browser.search') return 'Browser Search'
    if (action === 'browser.open') return 'Visit Website'
    return 'Browser Search'
  }

  if (tool === 'code_interpreter') {
    return 'Code Execution (Python)'
  }

  return tool
}

export function formatToolCost(cost: number): string {
  if (cost < 0.0001) return '<$0.0001'
  return `$${cost.toFixed(4)}`
}

/**
 * Parse executed_tools from Groq Compound API response
 *
 * Groq Compound API Structure (executed_tools):
 * - Each entry has: type, arguments, output, index
 * - Types include: browser_search, code_interpreter, etc.
 * - Arguments contain JSON with tool-specific parameters
 *
 * Example executed_tool:
 * {
 *   "type": "browser_search",
 *   "arguments": "{\"action\":\"search\",\"query\":\"...\"}",
 *   "output": "...",
 *   "index": 0
 * }
 */
export function parseToolCalls(executedToolsData: any): ToolUsage[] {
  if (!executedToolsData) return []

  try {
    // If executedToolsData is a string, parse it as JSON
    const data = typeof executedToolsData === 'string'
      ? JSON.parse(executedToolsData)
      : executedToolsData

    // Handle array of executed_tools (Groq Compound format)
    if (Array.isArray(data)) {
      return data.map((tool: any) => {
        const toolType = tool.type || ''

        // Parse arguments if it's a string
        let parsedArgs: any = {}
        try {
          parsedArgs = typeof tool.arguments === 'string'
            ? JSON.parse(tool.arguments)
            : (tool.arguments || {})
        } catch (e) {
          console.error('[Tool Costs] Failed to parse tool arguments:', e)
        }

        // Handle browser_search tool
        if (toolType === 'browser_search') {
          // Determine if it's a search or open action
          const action = parsedArgs.action === 'open'
            ? 'browser.open'
            : 'browser.search'

          return {
            tool: 'browser_search',
            action,
            count: 1,
          }
        }

        // Handle code_interpreter tool (Groq returns type as "python" or "code_interpreter")
        if (toolType === 'code_interpreter' || toolType === 'python') {
          // Try to get execution duration from tool data
          let duration = 1 // Default 1 second

          // Check if there's timing information
          if (parsedArgs.duration) {
            duration = parsedArgs.duration
          } else if (tool.execution_time) {
            duration = tool.execution_time
          }

          return {
            tool: 'code_interpreter',
            action: 'python',
            duration,
          }
        }

        // Unknown tool type - return generic structure
        console.warn('[Tool Costs] Unknown tool type:', toolType)
        return {
          tool: toolType,
          count: 1,
        }
      })
    }

    // Handle single tool
    if (data.type) {
      const toolType = data.type
      let parsedArgs: any = {}

      try {
        parsedArgs = typeof data.arguments === 'string'
          ? JSON.parse(data.arguments)
          : (data.arguments || {})
      } catch (e) {
        // Ignore
      }

      if (toolType === 'browser_search') {
        const action = parsedArgs.action === 'open'
          ? 'browser.open'
          : 'browser.search'

        return [{
          tool: 'browser_search',
          action,
          count: 1,
        }]
      }

      if (toolType === 'code_interpreter' || toolType === 'python') {
        return [{
          tool: 'code_interpreter',
          action: 'python',
          duration: data.execution_time || parsedArgs.duration || 1,
        }]
      }

      return [{
        tool: toolType,
        count: 1,
      }]
    }

    return []
  } catch (error) {
    console.error('[Tool Costs] Failed to parse executed_tools:', error)
    return []
  }
}
