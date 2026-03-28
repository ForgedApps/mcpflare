/* eslint-disable no-console */
const path = require('path')
const { spawn } = require('child_process')

const STARTUP_TIMEOUT_MS = 10000
const FORCE_KILL_TIMEOUT_MS = 2000
const READY_MARKER = 'MCPflare is ready to accept connections'
const FAILURE_MARKERS = [
  'Dynamic require of',
  'MODULE_NOT_FOUND',
  'Cannot find module',
]

const extensionRoot = path.resolve(__dirname, '..')
const bundledServerEntry = path.join(
  extensionRoot,
  'mcpflare-server',
  'dist',
  'server',
  'index.js',
)

function outputContainsFailure(output) {
  return FAILURE_MARKERS.some((marker) => output.includes(marker))
}

function verifyPackagedServerStartup() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bundledServerEntry], {
      cwd: extensionRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let combinedOutput = ''
    let resolved = false

    const cleanup = (signal) => {
      if (!child.killed) {
        child.kill(signal)
      }
    }

    const finishSuccess = () => {
      if (resolved) return
      resolved = true
      cleanup('SIGTERM')
      setTimeout(() => cleanup('SIGKILL'), FORCE_KILL_TIMEOUT_MS).unref()
      resolve()
    }

    const finishFailure = (message) => {
      if (resolved) return
      resolved = true
      cleanup('SIGTERM')
      setTimeout(() => cleanup('SIGKILL'), FORCE_KILL_TIMEOUT_MS).unref()
      reject(new Error(`${message}\n\nOutput:\n${combinedOutput}`))
    }

    const onChunk = (chunk) => {
      const text = chunk.toString('utf8')
      combinedOutput += text

      if (outputContainsFailure(combinedOutput)) {
        finishFailure('Packaged server startup hit a runtime import failure.')
        return
      }

      if (combinedOutput.includes(READY_MARKER)) {
        finishSuccess()
      }
    }

    child.stdout.on('data', onChunk)
    child.stderr.on('data', onChunk)

    child.on('error', (error) => {
      finishFailure(`Failed to start packaged server: ${error.message}`)
    })

    child.on('exit', (code) => {
      if (resolved) return

      if (code === 0 && combinedOutput.includes(READY_MARKER)) {
        finishSuccess()
      } else {
        finishFailure(`Packaged server exited before ready (exit code ${code}).`)
      }
    })

    setTimeout(() => {
      if (resolved) return
      finishFailure(
        `Timed out waiting ${STARTUP_TIMEOUT_MS}ms for packaged server readiness.`,
      )
    }, STARTUP_TIMEOUT_MS).unref()
  })
}

async function main() {
  console.log('Verifying packaged MCPflare server startup...')
  await verifyPackagedServerStartup()
  console.log('Packaged MCPflare server startup verification passed.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
