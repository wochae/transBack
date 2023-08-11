import { GameBall } from '../game.ball/game.ball';
import { GamePlayer } from '../game.player/game.player';
import { GameOptions } from '../game.options/game.options';

export class GameRoom {
  public roomId: string;
  public ballList: GameBall[];
  public user1: GamePlayer | null;
  public user2: GamePlayer | null;
  public option: GameOptions | null;
  public count: number;

  constructor(roomId: string) {
    this.roomId = roomId;
    this.user1 = null;
    this.user2 = null;
    this.option = null;
    this.count = 0;
    this.ballList = [];
    this.ballList.push(new GameBall());
  }

  public async setUser(
    userData: GamePlayer,
    option: GameOptions,
  ): Promise<boolean> {
    if (this.count == 0) this.user1 = userData;
    else this.user2 = userData;
    this.option = option;
    this.count++;
    return this.count === 2 ? true : false;
  }
}
