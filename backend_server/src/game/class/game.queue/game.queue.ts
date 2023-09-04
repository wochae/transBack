import { GamePlayer } from '../game.player/game.player';

export class GameQueue {
  playerList: GamePlayer[];

  constructor() {
    this.playerList = [];
  }

  pushPlayer(player: GamePlayer): number {
    return this.playerList.push(player);
  }

  findPlayerById(userIdx: number): GamePlayer | null {
    let target: GamePlayer | null;
    target = null;
    for (const queue of this.playerList) {
      if (queue.getUserObject().userIdx === userIdx) {
        target = queue;
      }
    }
    return target;
  }

  isQueueReady(): [GamePlayer, GamePlayer] | null {
    let ret: [GamePlayer, GamePlayer] | null;
    ret = null;
    if (this.playerList.length >= 2) {
      ret = [this.playerList[0], this.playerList[1]];
      return ret;
    }
  }
}
