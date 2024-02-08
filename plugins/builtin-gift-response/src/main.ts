import { printLog } from "../../../src/utils/print_log.ts"
interface IMsg {
    room: number,
    cmd: string,
    // deno-lint-ignore no-explicit-any
    data: any
}

interface IConfig {
    cold_down_time?: number
    free_gift_action?: boolean
    disable_gift_action?: boolean
    disable_super_chat_action?: boolean
    disable_graud_action?: boolean
    danmaku_template: {
        gift: string
        gift_total: string
        guard: string
        sc: string
    }
}

interface IProgramConfig extends IConfig {
    room_config: Record<string, IConfig>
}

// deno-lint-ignore no-explicit-any
function formatTemplate(str: string, args: any): string {
    let result: string = str
    for (const arg in args) {
        result = result.replace(new RegExp(`{${arg}}`, 'g'), args[arg])
    }
    return result
}

async function main() {
    const configFilePath = Deno.args[0]
    const token = Deno.args[1]
    const port = Deno.args[2]
    const decoder = new TextDecoder()

    const thanksColdDownSet = new Set<string>()
    const config: IProgramConfig = JSON.parse(decoder.decode(await Deno.readFile(configFilePath)))

    const eventSocket = new WebSocket(`ws://127.0.0.1:${port}`)

    eventSocket.addEventListener('message', (event) => {
        const msg: IMsg = JSON.parse(event.data)
        const room_config: IConfig = config.room_config[`${msg.room}`] || config
        if (msg.cmd === 'SEND_GIFT') {
            if (!room_config.disable_gift_action) {
                if (thanksColdDownSet.has(msg.data.uname)) {
                    return
                }
                if (room_config.free_gift_action || msg.data.super_gift_num > 0) {
                    // 通过框架发送弹幕
                    eventSocket.send(JSON.stringify({
                        cmd: 'send',
                        token,
                        data: {
                            room: msg.room,
                            at: msg.data.uid,
                            text: formatTemplate(config.danmaku_template.gift, {
                                gift: msg.data.giftName,
                                count: msg.data.super_gift_num
                            })
                        }
                    }))
                    thanksColdDownSet.add(msg.data.uname)
                    setTimeout(() => { thanksColdDownSet.delete(msg.data.uname) }, config.cold_down_time)
                }
            }
            return
        }
        if (msg.cmd === 'COMBO_SEND') {
            if (!room_config.disable_gift_action) {
                eventSocket.send(JSON.stringify({
                    cmd: 'send',
                    token,
                    data: {
                        room: msg.room,
                        at: msg.data.uid,
                        text: formatTemplate(config.danmaku_template.gift_total, {
                            gift: msg.data.giftName,
                            count: msg.data.super_gift_num
                        })
                    }
                }))
            }
            return
        }
        if (msg.cmd === 'GUARD_BUY') {
            if (!room_config.disable_graud_action) {
                eventSocket.send(JSON.stringify({
                    cmd: 'send',
                    token,
                    data: {
                        room: msg.room,
                        at: msg.data.uid,
                        text: formatTemplate(config.danmaku_template.guard, {
                            gift: msg.data.gift_name,
                            count: msg.data.num
                        })
                    }
                }))
            }
            return
        }
        if (msg.cmd === 'SUPER_CHAT_MESSAGE') {
            if (!room_config.disable_super_chat_action) {
                eventSocket.send(JSON.stringify({
                    cmd: 'send',
                    token,
                    data: {
                        room: msg.room,
                        at: msg.data.uid,
                        text: formatTemplate(config.danmaku_template.sc, {})
                    }
                }))
            }
            return
        }
    })
}

function sleep(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(() => { resolve() }, ms)
    })
}

if (import.meta.main) {
    printLog('礼物响应', '开始运行')
    await main()
    while (true) {
        await (sleep(100000))
    }
}