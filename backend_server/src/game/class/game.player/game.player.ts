export class GamePlayer {
  userIdx: number;
  paddlePosY: number;
  socketId: any;
  latency: number; //ms
  score: number;
  standardDate: any;

  constructor(userIdx: number, socketId: any) {
    this.userIdx = userIdx;
    this.paddlePosY = 0;
    this.socketId = socketId;
    this.latency = 0;
    this.score = 0;
  }

  public resetPlayer() {
    this.paddlePosY = 0;
  }

  public setLatency(value: number) {
    this.latency = value;
  }

  public getLatency(): number {
    return this.latency;
  }

  public setScore(): number {
    this.score += 1;
    return this.score;
  }
}
