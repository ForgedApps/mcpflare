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
if (fs.existsSync(sourceScreenshot)) {
  fs.copyFileSync(sourceScreenshot, targetScreenshot)
  console.log(`✅ Copied screenshot: ${sourceScreenshot} → ${targetScreenshot}`)
} else {
  console.warn(`⚠️  Source screenshot not found: ${sourceScreenshot}`)
}
