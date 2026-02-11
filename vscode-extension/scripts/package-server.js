/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const esbuild = require('esbuild')

const extensionRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(extensionRoot, '..')

const sourceDistDir = path.join(repoRoot, 'dist')
const sourceWranglerConfig = path.join(repoRoot, 'wrangler.toml')
const sourceServerEntry = path.join(repoRoot, 'src', 'server', 'index.ts')

const packagedServerRoot = path.join(extensionRoot, 'mcpflare-server')
const packagedDistDir = path.join(packagedServerRoot, 'dist')
const bundledServerEntry = path.join(packagedDistDir, 'server', 'index.js')

if (!fs.existsSync(sourceDistDir)) {
  throw new Error(
    `Server dist directory not found: ${sourceDistDir}. Run root build first.`,
  )
}

if (!fs.existsSync(sourceServerEntry)) {
  throw new Error(`Server entry file not found: ${sourceServerEntry}`)
}

// Start from a clean package directory.
fs.rmSync(packagedServerRoot, { recursive: true, force: true })
fs.mkdirSync(packagedServerRoot, { recursive: true })

// Keep worker/runtime and other compiled artifacts expected by WorkerManager.
fs.cpSync(sourceDistDir, packagedDistDir, { recursive: true })

// Make mcpflare-server act as the server project root for Wrangler execution.
fs.copyFileSync(
  sourceWranglerConfig,
  path.join(packagedServerRoot, 'wrangler.toml'),
)
fs.writeFileSync(
  path.join(packagedServerRoot, 'package.json'),
  `${JSON.stringify(
    {
      name: 'mcpflare-bundled-server',
      private: true,
      type: 'module',
    },
    null,
    2,
  )}\n`,
  'utf8',
)

// Bundle the server entrypoint so extension runtime does not depend on node_modules.
esbuild.buildSync({
  entryPoints: [sourceServerEntry],
  outfile: bundledServerEntry,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: ['node20'],
  sourcemap: false,
  legalComments: 'none',
})

console.log(`Packaged MCPflare server at ${bundledServerEntry}`)
