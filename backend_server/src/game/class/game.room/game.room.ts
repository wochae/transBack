import { GameBall } from '../game.ball/game.ball';
import { GamePlayer } from '../game.player/game.player';
import { GameOptions } from '../game.options/game.options';

export class GameRoom {
  private roomId: string;
  private ballList: GameBall[];
  private user1: GamePlayer | null;
  private user2: GamePlayer | null;
  private option: GameOptions | null;
  private count: number;

  constructor(roomId: string) {
    this.roomId = roomId;
    this.user1 = null;
    this.user2 = null;
    this.option = null;
    this.count = 0;
    this.ballList.push(new GameBall());
  }

  public setUser(userData: GamePlayer, option: GameOptions): boolean {
    if (this.count == 0) this.user1 = userData;
    else this.user2 = userData;
    this.option = option;
    this.count++;
    return this.count == 2 ? true : false;
  }

  public getCount(): number {
    return this.count;
  }
}
