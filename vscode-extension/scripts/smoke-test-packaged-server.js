/* eslint-disable no-console */
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const extensionRoot = path.resolve(__dirname, '..')
const packagedServerRoot = path.join(extensionRoot, 'mcpflare-server')
const serverEntryPath = path.join(
  packagedServerRoot,
  'dist',
  'server',
  'index.js',
)

if (!fs.existsSync(serverEntryPath)) {
  throw new Error(
    `Packaged server entry not found: ${serverEntryPath}. Run "npm run build:all" first.`,
  )
}

const startupTimeoutMs = 5000
const outputChunks = []
let finished = false

const proc = spawn(process.execPath, [serverEntryPath], {
  cwd: packagedServerRoot,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    NODE_ENV: 'production',
    MCPFLARE_PROJECT_ROOT: packagedServerRoot,
    LOG_LEVEL: process.env.LOG_LEVEL || 'error',
  },
})

const finish = (code, message) => {
  if (finished) {
    return
  }
  finished = true
  if (proc.pid) {
    proc.kill('SIGTERM')
    setTimeout(() => {
      try {
        proc.kill('SIGKILL')
      } catch {
        // Process already exited.
      }
    }, 400).unref()
  }

  if (message) {
    console.log(message)
  }
  process.exit(code)
}

proc.stdout.on('data', (data) => {
  if (outputChunks.length < 20) {
    outputChunks.push(data.toString())
  }
})

proc.stderr.on('data', (data) => {
  if (outputChunks.length < 20) {
    outputChunks.push(data.toString())
  }
})

proc.on('error', (error) => {
  finish(1, `Packaged server smoke test failed to start process: ${error.message}`)
})

proc.on('exit', (code, signal) => {
  const output = outputChunks.join('').trim()
  finish(
    1,
    [
      `Packaged server exited during startup (code=${code}, signal=${signal}).`,
      output ? `Output:\n${output}` : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
  )
})

setTimeout(() => {
  finish(0, 'Packaged server smoke test passed (startup remained healthy).')
}, startupTimeoutMs)
