/**
 * Version checking for NPM-based MCP servers
 * Detects installed versions and checks npm registry for updates
 */

import { spawn } from 'node:child_process'
import type { MCPServerInfo, MCPTokenMetrics } from './types'

/**
 * Version status for display
 */
export type VersionStatus =
  | 'up-to-date'
  | 'minor-behind'
  | 'major-behind'
  | 'unknown'

/**
 * Result of parsing npx package arguments
 */
export interface ParsedPackageInfo {
  /** Package name without version */
  packageName: string
  /** Pinned version if specified (e.g., @1.2.3) */
  pinnedVersion?: string
}

/**
 * Extract package name and optional pinned version from npx command args
 * Handles various npx patterns:
 * - npx -y @scope/package           -> { packageName: "@scope/package" }
 * - npx @scope/package@1.2.3        -> { packageName: "@scope/package", pinnedVersion: "1.2.3" }
 * - npx package-name                -> { packageName: "package-name" }
 * - npx package-name@1.2.3          -> { packageName: "package-name", pinnedVersion: "1.2.3" }
 */
export function extractPackageInfo(
  args: string[] | undefined,
): ParsedPackageInfo | null {
  if (!args || args.length === 0) {
    return null
  }

  // Find the first arg that's not a flag (doesn't start with -)
  for (const arg of args) {
    if (!arg.startsWith('-') && arg.trim().length > 0) {
      const trimmed = arg.trim()

      // Handle scoped packages (@scope/package or @scope/package@version)
      if (trimmed.startsWith('@')) {
        // Find the second @ which would be the version separator
        const secondAtIndex = trimmed.indexOf('@', 1)
        if (secondAtIndex > 0) {
          // Has version: @scope/package@1.2.3
          return {
            packageName: trimmed.substring(0, secondAtIndex),
            pinnedVersion: trimmed.substring(secondAtIndex + 1),
          }
        }
        // No version: @scope/package
        return { packageName: trimmed }
      }

      // Handle non-scoped packages (package or package@version)
      const atIndex = trimmed.indexOf('@')
      if (atIndex > 0) {
        // Has version: package@1.2.3
        return {
          packageName: trimmed.substring(0, atIndex),
          pinnedVersion: trimmed.substring(atIndex + 1),
        }
      }
      // No version: package
      return { packageName: trimmed }
    }
  }

  return null
}

/**
 * Extract just the package name from npx command args (legacy compatibility)
 */
export function extractPackageName(args: string[] | undefined): string | null {
  const info = extractPackageInfo(args)
  return info?.packageName || null
}

/**
 * Check if an MCP command is npx-based
 */
export function isNpxCommand(command: string | undefined): boolean {
  if (!command) {
    return false
  }
  return (
    command === 'npx' ||
    command.endsWith('npx.cmd') ||
    command.endsWith('\\npx.cmd')
  )
}

/**
 * Detect the installed version of an npm package
 * Uses `npm list <package> --depth=0 --json`
 */
export async function detectInstalledVersion(
  packageName: string,
): Promise<string | null> {
  return new Promise((resolve) => {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    const args = ['list', packageName, '--depth=0', '--json']

    const proc = spawn(npmCmd, args, {
      shell: process.platform === 'win32',
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''

    proc.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      try {
        // npm list returns JSON even on non-zero exit codes
        const result = JSON.parse(stdout)

        // Try to find the version in various locations
        // Global install: dependencies[packageName].version
        // Local install: dependencies[packageName].version
        if (result.dependencies && result.dependencies[packageName]) {
          resolve(result.dependencies[packageName].version || null)
          return
        }

        // If not found in dependencies, it might be a global package
        if (result.version) {
          resolve(result.version)
          return
        }

        resolve(null)
      } catch (error) {
        // If parsing fails, fall back to null
        console.error('Failed to parse npm list output:', error)
        resolve(null)
      }
    })

    proc.on('error', (error) => {
      console.error('Failed to run npm list:', error)
      resolve(null)
    })

    // Timeout after 5 seconds
    setTimeout(() => {
      proc.kill()
      resolve(null)
    }, 5000)
  })
}

/**
 * Check the latest version from npm registry
 * Uses the npm registry API: https://registry.npmjs.org/<package>/latest
 */
export async function checkLatestVersion(
  packageName: string,
): Promise<string | null> {
  try {
    const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      // 5 second timeout
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.error(
        `npm registry returned ${response.status} for ${packageName}`,
      )
      return null
    }

    const data = (await response.json()) as { version?: string }
    return data.version || null
  } catch (error) {
    console.error(`Failed to check latest version for ${packageName}:`, error)
    return null
  }
}

/**
 * Check if version cache is stale (older than 24 hours)
 */
export function isVersionStale(lastChecked: string | undefined): boolean {
  if (!lastChecked) {
    return true
  }

  const lastCheckedDate = new Date(lastChecked)
  const now = new Date()
  const diffMs = now.getTime() - lastCheckedDate.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  return diffHours >= 24
}

/**
 * Compare versions using semver logic
 * Returns version status for display
 */
export function compareVersions(
  installed: string | undefined,
  latest: string | undefined,
): VersionStatus {
  if (!installed || !latest) {
    return 'unknown'
  }

  // Parse semver versions (handle v prefix)
  const parseVersion = (v: string): number[] => {
    const cleaned = v.replace(/^v/, '')
    return cleaned.split('.').map((n) => parseInt(n, 10) || 0)
  }

  try {
    const installedParts = parseVersion(installed)
    const latestParts = parseVersion(latest)

    // Compare major version
    if (latestParts[0] > installedParts[0]) {
      return 'major-behind'
    }

    // Compare minor/patch versions
    if (
      latestParts[0] === installedParts[0] &&
      (latestParts[1] > installedParts[1] || latestParts[2] > installedParts[2])
    ) {
      return 'minor-behind'
    }

    // Up to date
    return 'up-to-date'
  } catch (error) {
    console.error('Failed to compare versions:', error)
    return 'unknown'
  }
}

/**
 * Get version status color for UI display
 */
export function getVersionStatusColor(status: VersionStatus): string {
  switch (status) {
    case 'up-to-date':
      return '#22c55e' // Green
    case 'minor-behind':
      return '#eab308' // Yellow
    case 'major-behind':
      return '#ef4444' // Red
    case 'unknown':
    default:
      return '#6b7280' // Gray
  }
}

/**
 * Check version for a single MCP and update its metrics
 * Returns updated metrics with latest version info
 *
 * For npx packages:
 * - If version is pinned in args (e.g., npx package@1.2.3), use that as installed version
 * - Otherwise, use latest version as "current" version (since npx runs latest by default)
 * - npm list doesn't work for npx packages (they're cached, not installed)
 */
export async function checkMCPVersion(
  server: MCPServerInfo,
  currentMetrics: MCPTokenMetrics | undefined,
): Promise<MCPTokenMetrics | undefined> {
  // Only check npx-based MCPs
  if (!isNpxCommand(server.command)) {
    return currentMetrics
  }

  // If no metrics exist yet, can't update
  if (!currentMetrics) {
    return currentMetrics
  }

  // Extract package info (name and optional pinned version)
  const packageInfo = extractPackageInfo(server.args)
  const packageName = currentMetrics.packageName || packageInfo?.packageName
  if (!packageName) {
    return currentMetrics
  }

  // Check if we need to refresh the latest version (stale after 24 hours)
  const needsVersionCheck = isVersionStale(currentMetrics.versionCheckedAt)

  // If we have all the data we need and it's fresh, no update needed
  if (
    !needsVersionCheck &&
    currentMetrics.installedVersion &&
    currentMetrics.latestVersion
  ) {
    return currentMetrics
  }

  // Check latest version from npm registry if needed
  let latestVersion = currentMetrics.latestVersion
  if (needsVersionCheck || !latestVersion) {
    latestVersion = (await checkLatestVersion(packageName)) || latestVersion
  }

  // Determine "installed" version for npx packages:
  // 1. If version is pinned in args (e.g., npx package@1.2.3), use that
  // 2. Otherwise, npx runs the latest version by default
  let installedVersion = currentMetrics.installedVersion
  if (!installedVersion) {
    if (packageInfo?.pinnedVersion) {
      // User has pinned a specific version
      installedVersion = packageInfo.pinnedVersion
    } else if (latestVersion) {
      // No pinned version = npx runs latest
      installedVersion = latestVersion
    }
  }

  // Update metrics with version info
  return {
    ...currentMetrics,
    packageName,
    installedVersion,
    latestVersion,
    versionCheckedAt: new Date().toISOString(),
  }
}

/**
 * Check versions for all NPM-based MCPs
 * Returns updated token metrics cache
 */
export async function checkAllMCPVersions(
  servers: MCPServerInfo[],
  tokenMetricsCache: Record<string, MCPTokenMetrics> = {},
): Promise<Record<string, MCPTokenMetrics>> {
  const updatedCache = { ...tokenMetricsCache }

  // Check versions in parallel (with concurrency limit)
  const BATCH_SIZE = 5 // Check 5 at a time to avoid rate limiting
  const batches: MCPServerInfo[][] = []

  for (let i = 0; i < servers.length; i += BATCH_SIZE) {
    batches.push(servers.slice(i, i + BATCH_SIZE))
  }

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (server) => {
        const currentMetrics = server.tokenMetrics
        const updatedMetrics = await checkMCPVersion(server, currentMetrics)

        if (updatedMetrics && updatedMetrics !== currentMetrics) {
          updatedCache[server.name] = updatedMetrics
        }
      }),
    )
  }

  return updatedCache
}


