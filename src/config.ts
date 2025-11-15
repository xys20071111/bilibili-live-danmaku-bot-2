export interface Credential {
  cookie: string;
  uid: number;
}

interface APIConfig {
  port: number;
}

export interface RoomConfig {
  room_id: number;
  verify?: Credential;
}

export interface ConfigStruct {
  verify: Credential;
  rooms: Array<RoomConfig>;
  api: APIConfig;
  connection_refresh_delay_ms: number;
}

const decoder = new TextDecoder("utf-8");
export const config: ConfigStruct = JSON.parse(
  decoder.decode(Deno.readFileSync(Deno.args[0])),
);
