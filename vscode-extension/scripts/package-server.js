/* eslint-disable no-console */
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const extensionRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(extensionRoot, '..')

const sourceDistDir = path.join(repoRoot, 'dist')
const sourceWranglerConfig = path.join(repoRoot, 'wrangler.toml')
const rootPackageJsonPath = path.join(repoRoot, 'package.json')

const packagedServerRoot = path.join(extensionRoot, 'mcpflare-server')
const packagedDistDir = path.join(packagedServerRoot, 'dist')
const packagedPackageJsonPath = path.join(packagedServerRoot, 'package.json')

if (!fs.existsSync(sourceDistDir)) {
  throw new Error(
    `Server dist directory not found: ${sourceDistDir}. Run root build first.`,
  )
}

if (!fs.existsSync(rootPackageJsonPath)) {
  throw new Error(`Root package.json not found: ${rootPackageJsonPath}`)
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

const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'))
const runtimeDependencyNames = [
  '@modelcontextprotocol/sdk',
  'dotenv',
  'jsonc-parser',
  'pino',
  'pino-pretty',
  'zod',
]
const packagedDependencies = Object.fromEntries(
  runtimeDependencyNames.map((name) => [name, rootPackageJson.dependencies[name]]),
)

fs.writeFileSync(
  packagedPackageJsonPath,
  `${JSON.stringify(
    {
      name: 'mcpflare-bundled-server',
      private: true,
      type: 'module',
      dependencies: packagedDependencies,
    },
    null,
    2,
  )}\n`,
  'utf8',
)

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const installResult = spawnSync(
  npmCmd,
  ['install', '--omit=dev', '--no-package-lock'],
  {
    cwd: packagedServerRoot,
    stdio: 'inherit',
  },
)
if (installResult.status !== 0) {
  throw new Error(
    `Failed to install packaged server dependencies (exit ${installResult.status})`,
  )
}

console.log(`Packaged MCPflare server at ${packagedServerRoot}`)
