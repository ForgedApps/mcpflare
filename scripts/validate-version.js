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

  // Compare versions using semver-compliant comparison
  // Handles pre-release versions (e.g., 1.3.4-beta.1) correctly
  const compareVersions = (v1, v2) => {
    // Extract base version (remove pre-release identifiers for numeric comparison)
    const parseVersion = (version) => {
      // Split on '-' to separate base version from pre-release
      const [base, ...prerelease] = version.split('-')
      const parts = base.split('.').map((p) => {
        const num = Number(p)
        return Number.isNaN(num) ? 0 : num
      })
      return { parts, prerelease: prerelease.join('-') }
    }

    const v1Parsed = parseVersion(v1)
    const v2Parsed = parseVersion(v2)

    // Compare numeric parts
    const maxLength = Math.max(v1Parsed.parts.length, v2Parsed.parts.length)
    for (let i = 0; i < maxLength; i++) {
      const p1 = v1Parsed.parts[i] || 0
      const p2 = v2Parsed.parts[i] || 0
      if (p1 > p2) return 1
      if (p1 < p2) return -1
    }

    // If base versions are equal, compare pre-release identifiers
    // Versions without pre-release are considered greater than pre-release versions
    if (v1Parsed.prerelease && !v2Parsed.prerelease) return -1
    if (!v1Parsed.prerelease && v2Parsed.prerelease) return 1
    if (v1Parsed.prerelease && v2Parsed.prerelease) {
      // Compare pre-release strings lexicographically
      return v1Parsed.prerelease.localeCompare(v2Parsed.prerelease)
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
