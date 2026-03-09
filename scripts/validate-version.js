#!/usr/bin/env node

/**
 * Validates that the version being published is higher than what's already on npm
 * This prevents version conflicts when publishing from different branches
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// Read package.json
const packagePath = join(rootDir, 'package.json')
const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))
const localVersion = packageJson.version

if (!localVersion) {
  console.error('❌ Error: Could not read version from package.json')
  process.exit(1)
}

// Get npm registry version
const packageName = packageJson.name
const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`

try {
  const response = await fetch(registryUrl, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  })

  if (!response.ok) {
    if (response.status === 404) {
      // Package doesn't exist yet, that's fine
      console.log(`✅ Package ${packageName} not found on npm - first publish`)
      process.exit(0)
    }
    throw new Error(`npm registry returned ${response.status}`)
  }

  const data = await response.json()
  const publishedVersion = data.version

  if (!publishedVersion) {
    console.log(`✅ No published version found - first publish`)
    process.exit(0)
  }

  // Compare versions using semver
  const compareVersions = (v1, v2) => {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0
      const p2 = parts2[i] || 0
      if (p1 > p2) return 1
      if (p1 < p2) return -1
    }
    return 0
  }

  const comparison = compareVersions(localVersion, publishedVersion)

  if (comparison <= 0) {
    console.error(
      `❌ Error: Version conflict detected!`,
    )
    console.error(`   Local version:    ${localVersion}`)
    console.error(`   Published version: ${publishedVersion}`)
    console.error(
      `   The version being published (${localVersion}) must be higher than the latest published version (${publishedVersion})`,
    )
    console.error(
      `\n   To fix this, bump the version using: npm version patch|minor|major`,
    )
    process.exit(1)
  }

  console.log(
    `✅ Version check passed: ${localVersion} > ${publishedVersion}`,
  )
} catch (error) {
  console.error(
    `❌ Error checking npm registry: ${error instanceof Error ? error.message : String(error)}`,
  )
  console.error(
    `   This check prevents version conflicts. If npm registry is unavailable,`,
  )
  console.error(`   you may need to retry the publish.`)
  process.exit(1)
}
