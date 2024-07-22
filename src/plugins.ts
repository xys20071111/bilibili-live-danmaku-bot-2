import { config } from './config.ts'
import { printError } from './utils/print_log.ts'

const plugins: Map<Deno.Command, Deno.ChildProcess> = new Map()

export async function launchAllPlugins(token: string) {
  const pluginsList = Deno.readDir('./plugins')
  for await (const plugin of pluginsList) {
    if (plugin.name === '.gitkeep') {
      continue
    }
    try {
      const pluginCommand = new Deno.Command(`./plugins/${plugin.name}/main`, {
        args: [
          `./plugins/${plugin.name}/config.json`,
          token,
          config.api.port.toString(),
        ],
      })
      const pluginProcess = pluginCommand.spawn()
      pluginProcess.output().then(() => {
        const pluginProcess = pluginCommand.spawn()
        plugins.delete(pluginCommand)
        plugins.set(pluginCommand, pluginProcess)
      })
      plugins.set(pluginCommand, pluginProcess)
    } catch {
      printError('主程序', `启动插件${plugin.name}失败`)
    }
  }
}

function stopAllPlugins() {
  for (const pluginProcess of plugins.values()) {
    try {
      pluginProcess.kill()
    } catch {
      //Do nothing here
    }
  }
  Deno.exit()
}

Deno.addSignalListener('SIGTERM', () => {
  stopAllPlugins()
  Deno.exit()
})

Deno.addSignalListener('SIGINT', () => {
  stopAllPlugins()
  Deno.exit()
})
