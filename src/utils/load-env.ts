import * as fs from 'node:fs'
import * as path from 'node:path'

function stripMatchingQuotes(value: string): string {
  if (value.length < 2) {
    return value
  }

  const first = value[0]
  const last = value[value.length - 1]
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1)
  }

  return value
}

/**
 * Lightweight .env loader used in bundled extension runtime.
 * Keeps dotenv-like behavior for common KEY=VALUE lines without CJS imports.
 */
export function loadEnvFromDotFile(fileName = '.env'): void {
  const envPath = path.resolve(process.cwd(), fileName)

  if (!fs.existsSync(envPath)) {
    return
  }

  let content: string
  try {
    content = fs.readFileSync(envPath, 'utf8')
  } catch {
    return
  }

  const lines = content.split(/\r?\n/u)

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const lineWithoutExport = line.startsWith('export ')
      ? line.slice('export '.length).trim()
      : line

    const separatorIndex = lineWithoutExport.indexOf('=')
    if (separatorIndex <= 0) {
      continue
    }

    const key = lineWithoutExport.slice(0, separatorIndex).trim()
    if (!key || key in process.env) {
      continue
    }

    let value = lineWithoutExport.slice(separatorIndex + 1).trim()
    const isQuoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))

    if (!isQuoted) {
      // Support inline comments for unquoted values.
      const commentStart = value.indexOf(' #')
      if (commentStart >= 0) {
        value = value.slice(0, commentStart).trim()
      }
    }

    const normalizedValue = stripMatchingQuotes(value).replace(/\\n/gu, '\n')
    process.env[key] = normalizedValue
  }
}
