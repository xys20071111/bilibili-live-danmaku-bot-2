import { Credential } from "./config.ts"

export interface DanmakuStruct {
  color?: number
  bubble?: number
  msg: string
  mode?: number
  fontsize?: number
  rnd?: number
  roomid?: number
  csrf?: string
  csrf_token?: string
  reply_mid?: number
}

export function sendDanmaku(roomId: number, danmaku: DanmakuStruct, cerdential: Credential) {
  if (danmaku.msg.length > 19) {
    sendDanmaku(roomId, {
      msg: danmaku.msg.slice(0, 15),
      reply_mid: danmaku.reply_mid,
      color: danmaku.color,
      bubble: danmaku.bubble,
      mode: danmaku.mode,
      fontsize: danmaku.fontsize
    }, cerdential)
    setTimeout(() => {
      sendDanmaku(roomId, {
        msg: danmaku.msg.slice(15, danmaku.msg.length),
        reply_mid: danmaku.reply_mid,
        color: danmaku.color,
        bubble: danmaku.bubble,
        mode: danmaku.mode,
        fontsize: danmaku.fontsize
      }, cerdential)
    }, 2000)
    return
  }
  danmaku.rnd = new Date().getTime()
  if (!danmaku.color) {
    danmaku.color = 16777215
  }
  if (!danmaku.bubble) {
    danmaku.bubble = 0
  }
  if (!danmaku.mode) {
    danmaku.mode = 1
  }
  if (!danmaku.fontsize) {
    danmaku.fontsize = 24
  }
  danmaku.roomid = roomId
  danmaku.csrf = danmaku.csrf_token = cerdential.csrf
  const data = new FormData()
  for (const k in danmaku) {
    data.append(k, danmaku[k as keyof DanmakuStruct]!.toString())
  }
  fetch("https://api.live.bilibili.com/msg/send", {
    method: 'POST',
    body: data,
    headers: {
      cookie: `buvid3=${cerdential.buvid3}; SESSDATA=${cerdential.sessdata}; bili_jct=${cerdential.csrf}`,
      "user-agent":
        "Mozilla/5.0 (X11 Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36",
      host: "api.live.bilibili.com",
      "Referer": "https://live.bilibili.com",
    }
  })
}
