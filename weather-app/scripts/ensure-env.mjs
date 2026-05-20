import fs from 'node:fs'
import path from 'node:path'

const envPath = path.resolve(process.cwd(), '.env')
const examplePath = path.resolve(process.cwd(), '.env.example')

if (fs.existsSync(envPath)) process.exit(0)

if (!fs.existsSync(examplePath)) {
  console.warn('[ensure-env] Missing .env and .env.example; skipping env setup.')
  process.exit(0)
}

fs.copyFileSync(examplePath, envPath)
console.log('[ensure-env] Created .env from .env.example')

