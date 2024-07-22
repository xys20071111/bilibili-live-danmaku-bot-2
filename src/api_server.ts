import { WebSocketClient, WebSocketServer } from 'websocket'
interface IAPIData {
    cmd: string
    token: string
    data: ISendDanmaku
}

export interface ISendDanmaku {
    room: string
    text: string
    at?: number
}

export class APIServer extends EventTarget {
    private server: WebSocketServer
    private token: string
    private connections = new Set<WebSocketClient>()
    constructor(port: number, token: string) {
        super()
        this.token = token
        this.server = new WebSocketServer(port)
        this.server.on('connection', (socket) => {
            this.connections.add(socket)
            socket.on('close', () => {
                this.connections.delete(socket)
            })
            socket.on('message', (rawData: string) => {
                try {
                    const msg: IAPIData = JSON.parse(rawData)
                    if (msg.token === this.token) {
                        this.dispatchEvent(new CustomEvent(msg.cmd, {
                            detail: msg.data
                        }))
                    }
                } catch {
                    //
                }
            })
        })
    }
    public boardcast(data: unknown) {
        this.server.clients.forEach((socket) => {
            socket.send(JSON.stringify(data))
        })
    }
}