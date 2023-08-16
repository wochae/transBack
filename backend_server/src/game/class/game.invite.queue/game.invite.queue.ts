import { GamePlayer } from '../game.player/game.player';
// import { GameOptions } from '../game.options/game.options';

export class GameInviteQueue {
  queueData: GamePlayer[];

  constructor() {
    this.queueData = [];
  }

  public Enqueue(user1: GamePlayer, user2: GamePlayer): boolean {
    const userFst = this.queueData.find(
      (user) => user.userIdx === user1.userIdx,
    );
    const userSecond = this.queueData.find(
      (user) => user.userIdx === user2.userIdx,
    );
    if (userFst !== undefined && userSecond !== undefined) {
      return true;
    } else {
      this.queueData.push(user1);
      this.queueData.push(user2);
      return false;
    }
  }

  public Dequeue(user1: GamePlayer, user2: GamePlayer): GamePlayer[] | null {
    let data: GamePlayer[];
    for (let index = 0; index < this.queueData.length; index++) {
      if (this.queueData[index].userIdx == user1.userIdx) {
        data.push(user1);
        this.queueData.splice(index);
      } else if (this.queueData[index].userIdx == user2.userIdx) {
        data.push(user2);
        this.queueData.splice(index);
      }
      if (data.length == 2) break;
    }
    if (data.length > 2 && data.length < 2) return null;
    return data;
  }
  public isEmpty(): boolean {
    return this.queueData.length == 0 ? true : false;
  }
  public size() {
    return this.queueData.length;
  }
}
