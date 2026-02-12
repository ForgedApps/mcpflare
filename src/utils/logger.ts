import { createRequire } from 'node:module'
import pino from 'pino'

// Determine log level - CLI mode is quieter by default
// Check for CLI mode: script name includes 'cli', or CLI_MODE env var is set
const isCLIMode =
  process.argv[1]?.includes('cli') || process.env.CLI_MODE === 'true'
// In test environment, silence all logs unless LOG_LEVEL is explicitly set
const isTestEnv =
  process.env.NODE_ENV === 'test' ||
  process.env.VITEST === 'true' ||
  process.argv[1]?.includes('vitest')
const defaultLevel = isTestEnv ? 'silent' : isCLIMode ? 'warn' : 'info' // Silent in tests, warn in CLI, info otherwise

// Detect dev mode - when running via tsx or NODE_ENV is not production
const isDevMode = process.env.NODE_ENV !== 'production' && !isTestEnv

// When running as an MCP server via stdio, we MUST write logs to stderr
// to avoid interfering with stdout JSON-RPC protocol communication
const loggerConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || defaultLevel,
}

// In dev mode, use pino-pretty for readable logs (configured to write to stderr)
// In production/server mode, write JSON logs to stderr (standard practice for servers)
// Check if we're running in a TTY - if not, we're likely an MCP server via stdio, so disable colors
const isTTY = process.stderr.isTTY === true
let logger: pino.Logger

if (isDevMode) {
  try {
    // Load pino-pretty lazily so packaged runtimes can run without optional dev formatting deps.
    const require = createRequire(import.meta.url)
    const pinoPrettyModule = require('pino-pretty') as unknown
    const pinoPretty = (
      typeof pinoPrettyModule === 'function'
        ? pinoPrettyModule
        : (pinoPrettyModule as { default?: unknown }).default
    ) as
      | ((options: Record<string, unknown>) => NodeJS.WritableStream)
      | undefined

    if (typeof pinoPretty === 'function') {
      logger = pino(
        loggerConfig,
        pinoPretty({
          destination: process.stderr,
          colorize: isTTY, // Only colorize if we're in a terminal
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
        }),
      )
    } else {
      logger = pino(loggerConfig, process.stderr)
    }
  } catch {
    logger = pino(loggerConfig, process.stderr)
  }
} else {
  // In production/server mode, write JSON logs to stderr
  logger = pino(loggerConfig, process.stderr)
}

export default logger
