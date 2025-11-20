/**
 * Formatter for Wrangler output to make it visually distinct and professional
 */

/**
 * Check if verbose mode is enabled
 */
function isVerbose(): boolean {
  return (
    process.argv.includes('--verbose') ||
    process.argv.includes('-v') ||
    process.env.LOG_LEVEL === 'debug'
  )
}

/**
 * Strip ANSI color codes from a string
 */
function stripAnsiCodes(str: string): string {
  // Remove ANSI escape sequences
  // biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape sequences require control characters
  return str.replace(/\u001b\[[0-9;]*m/g, '')
}

/**
 * Format a Wrangler error with context
 * Normal mode: Simple error header + formatted STDERR
 * Verbose mode: Full details with context, STDOUT, STDERR
 */
export function formatWranglerError(
  error: Error,
  stdout: string,
  stderr: string,
  context?: {
    mcpId?: string
    port?: number
    tempDir?: string
    userCode?: string
  },
): string {
  const verbose = isVerbose()
  const lines: string[] = []

  // Simple header with icon
  lines.push('')
  lines.push('❌ Wrangler Execution Error')

  if (verbose) {
    lines.push('─'.repeat(60))
    // Verbose mode: Show error message and context
    if (error.message) {
      const cleanMessage = stripAnsiCodes(error.message)
      lines.push(`Error: ${cleanMessage}`)
      lines.push('')
    }

    // Context information (verbose only)
    if (context) {
      lines.push('Context:')
      if (context.mcpId) {
        lines.push(`  MCP ID: ${context.mcpId}`)
      }
      if (context.port) {
        lines.push(`  Port: ${context.port}`)
      }
      if (context.tempDir) {
        lines.push(`  Temp Dir: ${context.tempDir}`)
        lines.push(`  You can inspect the generated files in this directory`)
      }
      if (context.userCode) {
        lines.push('')
        lines.push('Your code:')
        lines.push('─'.repeat(60))
        const codeLines = context.userCode.split('\n')
        codeLines.forEach((line: string, index: number) => {
          lines.push(`${(index + 1).toString().padStart(3, ' ')} | ${line}`)
        })
        lines.push('─'.repeat(60))
      }
      lines.push('')
    }

    // STDOUT (verbose only)
    if (stdout.trim()) {
      const cleanStdout = stripAnsiCodes(stdout).trim()
      if (cleanStdout) {
        lines.push('Wrangler STDOUT:')
        lines.push('─'.repeat(60))
        lines.push(cleanStdout)
        lines.push('')
      }
    }
  }

  // STDERR (always shown, this is the important part)
  if (stderr.trim()) {
    const cleanStderr = stripAnsiCodes(stderr).trim()
    if (cleanStderr) {
      // Check if this is a build/compilation error
      const isBuildError =
        cleanStderr.includes('Build failed') ||
        cleanStderr.includes('build failed') ||
        cleanStderr.includes('✗ Build failed')

      if (verbose) {
        lines.push('Wrangler STDERR:')
        // Only add separator here if it's not a build error (build errors add their own separator)
        if (!isBuildError) {
          lines.push('─'.repeat(60))
        }
      }

      if (isBuildError) {
        // Special handling for esbuild/Wrangler compilation errors
        if (verbose) {
          lines.push('─'.repeat(60))
        }
        lines.push('')
        lines.push('🔍 TypeScript Compilation Error')
        lines.push('')
        lines.push(
          'Your code has a syntax error that prevented it from compiling.',
        )
        lines.push('')
        // Only suggest verbose mode if not already in verbose mode
        if (!verbose) {
          lines.push(
            '💡 Add the -v or --verbose flag to see your code and more details.',
          )
          lines.push('')
        }
      }

      // Format stderr nicely - extract key error messages
      const stderrLines = cleanStderr.split('\n')
      let inErrorBlock = false
      let errorFile = ''
      let errorLine = ''
      let errorColumn = ''

      for (const line of stderrLines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        // Skip "logs were written to" line unless in verbose mode
        if (
          trimmed.includes('Logs were written to') ||
          trimmed.includes('🪵')
        ) {
          if (verbose) {
            lines.push(`    ${trimmed}`)
          }
          continue
        }

        // Extract file location from esbuild errors (e.g., "user-code.ts:4:68:")
        const fileLocationMatch = trimmed.match(/(\S+\.ts):(\d+):(\d+):/)
        if (fileLocationMatch) {
          errorFile = fileLocationMatch[1]
          errorLine = fileLocationMatch[2]
          errorColumn = fileLocationMatch[3]
        }

        // Highlight error lines
        if (
          trimmed.includes('[ERROR]') ||
          trimmed.includes('ERROR') ||
          trimmed.includes('Error:') ||
          trimmed.includes('✗') ||
          trimmed.includes('Build failed') ||
          trimmed.includes('must be initialized') ||
          trimmed.includes('expected') ||
          trimmed.includes('unexpected')
        ) {
          if (!inErrorBlock) {
            if (!isBuildError) {
              lines.push('─'.repeat(60))
              lines.push('')
            }
            inErrorBlock = true
          }
          // Remove redundant [ERROR] prefix and X mark if present
          // Wrangler outputs "X [ERROR] ..." and we add "✗", so remove the X
          const cleanLine = trimmed
            .replace(/^X\s*\[ERROR\]\s*/i, '') // Remove "X [ERROR] " prefix
            .replace(/^\[ERROR\]\s*/i, '') // Remove "[ERROR] " if no X
            .replace(/^X\s+/i, '') // Remove standalone "X " prefix
            .replace(/^✗\s+/, '') // Remove standalone "✗ " prefix
            .trim()

          // For build errors, show file location if available
          if (
            isBuildError &&
            errorFile &&
            errorLine &&
            !cleanLine.includes(errorFile)
          ) {
            lines.push(`  ✗ ${errorFile}:${errorLine}:${errorColumn || '?'}`)
            lines.push(`    ${cleanLine}`)
          } else {
            lines.push(`  ✗ ${cleanLine}`)
          }
        } else if (
          trimmed.includes('│') ||
          trimmed.includes('─') ||
          trimmed.includes('═')
        ) {
        } else if (trimmed.includes('╵') || trimmed.includes('^')) {
          // Show caret indicators (pointing to error location)
          if (inErrorBlock) {
            lines.push(`    ${trimmed}`)
          }
        } else if (inErrorBlock || verbose) {
          // Show other lines in verbose mode or if we're in an error block
          lines.push(`    ${trimmed}`)
        }
      }

      if (!verbose && !inErrorBlock) {
        // If no error markers found, show the first few meaningful lines
        const meaningfulLines = stderrLines
          .map((l) => l.trim())
          .filter(
            (l) =>
              l &&
              !l.match(/^[│─═╔╗╚╝╠╣]/) &&
              !l.includes('Logs were written to') &&
              !l.includes('🪵'),
          )
          .slice(0, 5)
        for (const line of meaningfulLines) {
          lines.push(`  ${line}`)
        }
      }

      // Add closing separator only if we have content and haven't already added one for build errors
      if (inErrorBlock || (verbose && !isBuildError)) {
        lines.push('─'.repeat(60))
      }
    }
  }
  lines.push('')

  return lines.join('\n')
}

/**
 * Format nested JSON structure for better readability
 * Handles cases where JSON contains string fields with nested JSON
 */
function formatNestedJsonStructure(obj: unknown, indent = 0): string {
  const indentStr = '  '.repeat(indent)
  const nextIndent = indent + 1
  const nextIndentStr = '  '.repeat(nextIndent)

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    const items = obj.map((item) => {
      const formatted = formatNestedJsonStructure(item, nextIndent)
      // Handle multi-line items (objects/arrays)
      if (formatted.includes('\n')) {
        return `${nextIndentStr}${formatted}`
      }
      return `${nextIndentStr}${formatted}`
    })
    return `[\n${items.join(',\n')}\n${indentStr}]`
  }

  if (obj && typeof obj === 'object') {
    const keys = Object.keys(obj)
    if (keys.length === 0) return '{}'
    const entries = keys.map((key) => {
      const value = (obj as Record<string, unknown>)[key]
      if (
        key === 'text' &&
        typeof value === 'string' &&
        (value.trim().startsWith('{') || value.trim().startsWith('['))
      ) {
        // Try to parse and format nested JSON in text fields
        try {
          const parsed = JSON.parse(value)
          const formatted = formatNestedJsonStructure(parsed, nextIndent)
          return `${nextIndentStr}"${key}": ${formatted}`
        } catch {
          // If parsing fails, treat as regular string
          return `${nextIndentStr}"${key}": ${JSON.stringify(value)}`
        }
      } else {
        const formattedValue = formatNestedJsonStructure(value, nextIndent)
        return `${nextIndentStr}"${key}": ${formattedValue}`
      }
    })
    return `{\n${entries.join(',\n')}\n${indentStr}}`
  }

  // Primitive values
  return JSON.stringify(obj)
}

/**
 * Try to parse and pretty-print JSON from a string
 * Returns the pretty-printed JSON if successful, null otherwise
 */
function tryPrettyPrintJson(str: string): string | null {
  // Handle "Result: " prefix from console.log statements
  let jsonStr = str.trim()
  const resultPrefix = 'Result: '
  if (jsonStr.startsWith(resultPrefix)) {
    jsonStr = jsonStr.substring(resultPrefix.length).trim()
  }

  // First, try to parse the entire string as JSON
  try {
    const parsed = JSON.parse(jsonStr)
    // Use custom formatter that handles nested JSON strings
    const formatted = formatNestedJsonStructure(parsed, 0)
    // If we had a prefix, add it back
    if (str.startsWith(resultPrefix)) {
      return `${resultPrefix}${formatted}`
    }
    return formatted
  } catch {
    // If parsing the entire string fails, try to find JSON objects/arrays within the text
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        // Use custom formatter
        const formatted = formatNestedJsonStructure(parsed, 0)
        const result = jsonStr.replace(jsonMatch[0], formatted)
        // If we had a prefix, add it back
        if (str.startsWith(resultPrefix)) {
          return `${resultPrefix}${result}`
        }
        return result
      } catch {
        // If we can't parse the matched JSON either, return null
        return null
      }
    }
    return null
  }
}

/**
 * Format execution result for display
 */
export function formatExecutionResult(result: {
  success: boolean
  output?: string
  error?: string
  execution_time_ms: number
  metrics?: {
    mcp_calls_made: number
    tools_called?: string[]
    schema_efficiency?: {
      total_tools_available: number
      tools_used: string[]
      schema_size_total_chars: number
      schema_size_used_chars: number
      schema_utilization_percent: number
      schema_efficiency_ratio: number
      schema_size_reduction_chars: number
      schema_size_reduction_percent: number
      estimated_tokens_total?: number
      estimated_tokens_used?: number
      estimated_tokens_saved?: number
    }
    security?: {
      network_isolation_enabled: boolean
      process_isolation_enabled: boolean
      isolation_type: string
      security_level: string
      protection_summary: string[]
    }
  }
}): string {
  const lines: string[] = []

  lines.push('')
  lines.push(result.success ? '✅ Execution Successful' : '❌ Execution Failed')
  lines.push('─'.repeat(60))

  if (result.error) {
    lines.push(`Error: ${result.error}`)
    lines.push('')
  }

  if (result.output) {
    lines.push('Output:')
    // Try to pretty-print JSON in the output
    const prettyPrinted = tryPrettyPrintJson(result.output)
    if (prettyPrinted) {
      // Split the pretty-printed JSON into lines and indent each line
      const outputLines = prettyPrinted.split('\n')
      for (const line of outputLines) {
        lines.push(`  ${line}`)
      }
    } else {
      // If not JSON, display as-is
      const outputLines = result.output.split('\n')
      for (const line of outputLines) {
        if (line.trim()) {
          lines.push(`  ${line}`)
        }
      }
    }
    lines.push('')
  }

  lines.push('Metrics:')
  if (result.metrics) {
    // Combine MCP calls, execution time, and schema reduction with token estimate
    let firstLine = `${result.metrics.mcp_calls_made} MCP calls: ${result.execution_time_ms}ms`
    if (result.metrics.schema_efficiency) {
      const se = result.metrics.schema_efficiency
      const reduction = se.schema_size_reduction_percent.toFixed(0)
      if (reduction !== '0') {
        // Show token estimate if available (more meaningful than just percentage)
        if (se.estimated_tokens_saved && se.estimated_tokens_saved > 0) {
          firstLine += ` (~${se.estimated_tokens_saved.toLocaleString()} tokens saved, ${reduction}% reduction)`
        } else {
          firstLine += ` (${reduction}% schema reduction)`
        }
      }
    }
    lines.push(`  ${firstLine}`)
    
    // Security Metrics - security level first
    if (result.metrics.security) {
      const sec = result.metrics.security
      const networkStatus = sec.network_isolation_enabled ? '✓' : '✗'
      const processStatus = sec.process_isolation_enabled ? '✓' : '✗'
      lines.push(`  Security (${sec.security_level.toUpperCase()}): Network ${networkStatus} | Process ${processStatus}`)
    }
  } else {
    lines.push(`  Execution Time: ${result.execution_time_ms}ms`)
  }

  lines.push('─'.repeat(60))
  lines.push('')

  return lines.join('\n')
}
