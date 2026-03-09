/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')

const extensionRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(extensionRoot, '..')

const sourceScreenshot = path.join(repoRoot, 'assets', 'vscode_extension.png')
const targetMediaDir = path.join(extensionRoot, 'media')
const targetScreenshot = path.join(targetMediaDir, 'vscode_extension.png')

// Ensure media directory exists
if (!fs.existsSync(targetMediaDir)) {
  fs.mkdirSync(targetMediaDir, { recursive: true })
}

// Copy screenshot from assets to media directory
if (!fs.existsSync(sourceScreenshot)) {
  console.error(
    `❌ Error: Source screenshot not found: ${sourceScreenshot}`,
  )
  console.error(
    `   Expected location: ${path.relative(process.cwd(), sourceScreenshot)}`,
  )
  console.error(
    '   The screenshot must exist in the assets/ directory at the repository root.',
  )
  process.exit(1)
}

fs.copyFileSync(sourceScreenshot, targetScreenshot)
console.log(
  `✅ Copied screenshot: ${path.relative(process.cwd(), sourceScreenshot)} → ${path.relative(process.cwd(), targetScreenshot)}`,
)
