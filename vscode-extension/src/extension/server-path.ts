import * as fs from 'fs'
import * as path from 'path'

/**
 * Bundled server path used by marketplace-installed extensions.
 */
export function getBundledMCPflareServerPath(extensionPath: string): string {
  return path.join(extensionPath, 'mcpflare-server', 'server', 'index.js')
}

/**
 * Legacy dev path used by older extension versions.
 */
function getLegacyDevMCPflareServerPath(extensionPath: string): string {
  return path.join(extensionPath, '..', 'dist', 'server', 'index.js')
}

/**
 * Legacy bundled path from older extension startup logic.
 */
function getLegacyBundledMCPflareServerPath(extensionPath: string): string {
  return path.join(extensionPath, 'mcpflare-server', 'index.js')
}

/**
 * Resolve the best server path for the current extension install.
 */
export function resolveMCPflareServerPath(extensionPath: string): string {
  const bundledPath = getBundledMCPflareServerPath(extensionPath)
  if (fs.existsSync(bundledPath)) {
    return bundledPath
  }

  const legacyDevPath = getLegacyDevMCPflareServerPath(extensionPath)
  if (fs.existsSync(legacyDevPath)) {
    return legacyDevPath
  }

  // Prefer bundled path by default for marketplace installs.
  return bundledPath
}

/**
 * Detect known broken/legacy server path values for migration.
 */
export function isLegacyMCPflareServerPath(
  serverPath: string,
  extensionPath: string,
): boolean {
  const normalizedPath = normalizePathForComparison(serverPath)
  const legacyPaths = [
    getLegacyDevMCPflareServerPath(extensionPath),
    getLegacyBundledMCPflareServerPath(extensionPath),
  ].map(normalizePathForComparison)

  return legacyPaths.includes(normalizedPath)
}

function normalizePathForComparison(filePath: string): string {
  return path.normalize(filePath).toLowerCase()
}
