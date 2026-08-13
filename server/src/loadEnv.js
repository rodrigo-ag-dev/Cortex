import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.resolve(__dirname, '../.env')

const parseEnvLine = (line) => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) {
    return null
  }

  const index = trimmed.indexOf('=')
  if (index === -1) {
    return null
  }

  const key = trimmed.slice(0, index).trim()
  let value = trimmed.slice(index + 1).trim()

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }

  return { key, value }
}

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const entry = parseEnvLine(line)
    if (entry && process.env[entry.key] === undefined) {
      process.env[entry.key] = entry.value
    }
  }
}

export default null
