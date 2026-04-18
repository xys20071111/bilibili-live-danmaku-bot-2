import { config } from "./config.ts";
import { printError } from "./utils/print_log.ts";

const plugins: WeakMap<string, Deno.ChildProcess> = new WeakMap();

export async function launchAllPlugins(token: string) {
  const pluginsList = Deno.readDir("./plugins");
  for await (const plugin of pluginsList) {
    if (plugin.name === ".gitkeep") {
      continue;
    }
    try {
      const pluginProcess = Deno.spawn(`./plugins/${plugin.name}/main`, {
        args: [
          `./plugins/${plugin.name}/config.json`,
          token,
          config.api.port.toString(),
        ],
      });
      pluginProcess.output().then(() => {
        const pluginProcess = pluginCommand.spawn();
        plugins.delete(pluginCommand);
        plugins.set(pluginCommand, pluginProcess);
      });
      plugins.set(plugin.name, pluginProcess);
    } catch {
      printError("主程序", `启动插件${plugin.name}失败`);
    }
  }
}

function stopAllPlugins() {
  for (const pluginProcess of plugins.values()) {
    try {
      pluginProcess.kill();
    } catch {
      //Do nothing here
    }
  }
  Deno.exit();
}

Deno.addSignalListener("SIGTERM", () => {
  stopAllPlugins();
  Deno.exit();
});

Deno.addSignalListener("SIGINT", () => {
  stopAllPlugins();
  Deno.exit();
});
