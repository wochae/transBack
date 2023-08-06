import { GameBall } from '../game.ball/game.ball';
import { GamePlayer } from '../game.player/game.player';
import { GameOptions } from '../game.options/game.options';

export class GameRoom {
  private roomId: string;
  private ballList: GameBall[];
  private user1: GamePlayer;
  private user2: GamePlayer;
  private option: GameOptions;

  constructor(
    roomId: string,
    userIdx: number,
    socketId: any,
    userIdx2: number,
    socketId2: any,
    options: GameOptions,
  ) {
    this.user1 = new GamePlayer(userIdx, socketId);
    this.user2 = new GamePlayer(userIdx2, socketId2);
    this.ballList.push(new GameBall());
    this.roomId = roomId;
    this.option = new GameOptions(options.getSpeed(), options.getMapNumber());
  }
}
