/**
 * Suppress console output during tests unless explicitly enabled
 * Set VERBOSE_TESTS=true to see all console output
 */
const isVerbose = process.env.VERBOSE_TESTS === 'true'

if (!isVerbose) {
  // Suppress console output globally during tests
  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error
  const originalInfo = console.info

  // Store originals for potential restoration
  ;(globalThis as any).__originalConsole = {
    log: originalLog,
    warn: originalWarn,
    error: originalError,
    info: originalInfo,
  }

  // Suppress all console output
  console.log = () => {}
  console.warn = () => {}
  console.error = () => {}
  console.info = () => {}
}
