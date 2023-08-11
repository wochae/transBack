import { UserObject } from 'src/entity/users.entity';
import { Socket } from 'socket.io';
export class GamePlayer {
  userIdx: number;
  userObject: UserObject;
  socket: Socket;
  paddlePosY: number;
  latency: number; //ms
  score: number;
  standardDate: any;

  constructor(userIdx: number, userObject: UserObject, socket: Socket) {
    this.userIdx = userIdx;
    this.paddlePosY = 0;
    this.socket = socket;
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
