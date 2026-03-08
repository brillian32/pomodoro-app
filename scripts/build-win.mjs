import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const electronBuilderCli = require.resolve('electron-builder/out/cli/cli.js')
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const outputDir = `dist/win-${timestamp}`

const extraArgs = process.argv.slice(2)
const args = [electronBuilderCli, '--win', `--config.directories.output=${outputDir}`, ...extraArgs]

const result = spawnSync(process.execPath, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    ELECTRON_BUILDER_BINARIES_MIRROR:
      process.env.ELECTRON_BUILDER_BINARIES_MIRROR || 'https://npmmirror.com/mirrors/electron-builder-binaries/'
  }
})

if (result.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result.status ?? 1)
