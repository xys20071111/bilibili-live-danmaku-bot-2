import { config } from "./config.ts";
import { printError, printLog } from "./utils/print_log.ts";

interface PluginInfo {
  name: string;
  process: Deno.ChildProcess;
  restartCount: number;
  lastRestartTime: number;
}

const plugins: Map<string, PluginInfo> = new Map();
const MAX_RESTART_COUNT = 3;
const RESTART_WINDOW_MS = 60000;
const RESTART_DELAY_MS = 3000;

function launchPlugin(name: string, token: string): boolean {
  try {
    const pluginProcess = Deno.spawn(`./plugins/${name}/main`, {
      args: [
        `./plugins/${name}/config.json`,
        token,
        config.api.port.toString(),
      ],
      stdin: "null",
      stdout: "piped",
      stderr: "piped",
    });

    pluginProcess.status.then((status) => {
      const pluginInfo = plugins.get(name);
      if (!pluginInfo) return;

      printLog(name, `进程退出 - 码：${status.code}, SIG：${status.signal}`);

      handlePluginRestart(name, token);
    });

    const now = Date.now();
    plugins.set(name, {
      name,
      process: pluginProcess,
      restartCount: 0,
      lastRestartTime: now,
    });

    printLog(name, "插件已启动");
    return true;
  } catch (error) {
    printError(name, `启动失败：${error}`);
    return false;
  }
}

async function handlePluginRestart(name: string, token: string) {
  const pluginInfo = plugins.get(name);
  if (!pluginInfo) return;

  const now = Date.now();
  
  if (now - pluginInfo.lastRestartTime > RESTART_WINDOW_MS) {
    pluginInfo.restartCount = 0;
    pluginInfo.lastRestartTime = now;
  }

  pluginInfo.restartCount++;
  if (pluginInfo.restartCount > MAX_RESTART_COUNT) {
    printError(name, `在${RESTART_WINDOW_MS/1000}秒内重启${MAX_RESTART_COUNT}次，停止重启`);
    plugins.delete(name);
    return;
  }

  printLog(name, `将在${RESTART_DELAY_MS/1000}秒后重启 (第${pluginInfo.restartCount}次)`);
  
  await sleep(RESTART_DELAY_MS);
  
  await launchPlugin(name, token);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function launchAllPlugins(token: string) {
  try {
    const pluginsDir = await Deno.readDir("./plugins");
    for await (const plugin of pluginsDir) {
      if (!plugin.isDirectory) continue;
      if (plugin.name === ".gitkeep") continue;
      if (config.disabled_plugins?.includes(plugin.name)) continue;

      await launchPlugin(plugin.name, token);
    }
  } catch (error) {
    printError("主程序", `读取插件目录失败：${error}`);
  }
}

export async function restartPlugin(name: string, token: string): Promise<boolean> {
  const pluginInfo = plugins.get(name);
  if (pluginInfo) {
    try {
      pluginInfo.process.kill("SIGTERM");
      await pluginInfo.process.status;
    } catch {
    }
    plugins.delete(name);
  }

  return await launchPlugin(name, token);
}

function stopAllPlugins() {
  for (const [name, pluginInfo] of plugins.entries()) {
    try {
      pluginInfo.process.kill("SIGTERM");
      printLog(name, "已发送终止信号");
    } catch {
    }
  }
}

Deno.addSignalListener("SIGTERM", () => {
  stopAllPlugins();
  Deno.exit();
});

Deno.addSignalListener("SIGINT", () => {
  stopAllPlugins();
  Deno.exit();
});
