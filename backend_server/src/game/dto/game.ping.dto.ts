export class GamePingDto {
  serverTime: number;

  constructor() {
    this.serverTime = Date.now();
  }
}

export class GamePingReceiveDto {
  userIdx: number;
  serverTime: number;
  clientTime: number;
}
