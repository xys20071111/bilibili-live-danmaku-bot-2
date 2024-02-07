import { config, type RoomConfig } from './config.ts'
import { DanmakuReceiver } from './danmaku_receiver.ts'
import { APIServer } from './api_server.ts'
import { sendDanmaku } from './send_danmaku.ts'
import { launchAllPlugins } from "./plugins.ts"

async function main() {
  const roomReceiverMap: Map<RoomConfig, DanmakuReceiver> = new Map()
  const apiToken = crypto.randomUUID()
  const apiServer = new APIServer(config.api.port, apiToken)
  await launchAllPlugins(apiToken)
  for (const room of config.rooms) {
    const receiver = new DanmakuReceiver(room.room_id, room.verify || config.verify)
    receiver.addEventListener('danmakuEvent', (e) => {
      const event = e as CustomEvent
      apiServer.boardcast(event.detail)
    })
    await receiver.connect()
    roomReceiverMap.set(room, receiver)
  }
  apiServer.addEventListener('send', (e) => {
    const event = e as CustomEvent
    for (const [room, _receiver] of roomReceiverMap) {
      if (room.room_id === event.detail.room) {
        sendDanmaku(room.room_id, {
          msg: event.detail.text,
          reply_mid: event.detail.at
        }, room.verify || config.verify)
      }
    }
  })
}
if (import.meta.main) {
  await main()
}