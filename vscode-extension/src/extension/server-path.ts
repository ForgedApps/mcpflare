import * as path from 'path'

/**
 * MCPflare server path bundled with the extension package.
 */
export function resolveMCPflareServerPath(extensionPath: string): string {
  return path.join(
    extensionPath,
    'mcpflare-server',
    'dist',
    'server',
    'index.js',
  )
}
