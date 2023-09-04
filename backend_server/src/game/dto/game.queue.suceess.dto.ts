import { GamePlayer } from '../class/game.player/game.player';

export class GameQueueSuccessDto {
  dbKey: number;
  userNicknameFirst: string;
  userIdxFirst: number;
  userNicknameSecond: string;
  userIdxSecond: number;
  successDate: Date;

  constructor(dbIdx: number, players: GamePlayer[]) {
    this.dbKey = dbIdx;
    this.userNicknameFirst = players[0].getUserObject().nickname;
    this.userIdxFirst = players[0].getUserObject().userIdx;
    this.userNicknameSecond = players[1].getUserObject().nickname;
    this.userIdxSecond = players[1].getUserObject().userIdx;
    this.successDate = new Date();
  }
}
