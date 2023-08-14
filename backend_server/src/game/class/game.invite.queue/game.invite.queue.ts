import { GamePlayer } from '../game.player/game.player';
// import { GameOptions } from '../game.options/game.options';

export class GameInviteQueue {
  queueData: [GamePlayer, GamePlayer][];

  constructor() {
    this.queueData = [];
  }

  public Enqueue(users: GamePlayer[]) {
    const data: [GamePlayer, GamePlayer] = [users[0], users[1]];
    this.queueData.push(data);
  }

  public Dequeue(): GamePlayer[] | null {
    if (this.queueData.length < 1) return null;
    let data: GamePlayer[];
    data.push(this.queueData[0][0]);
    data.push(this.queueData[0][1]);
    this.queueData.splice(1);
    return data;
  }
  public isEmpty(): boolean {
    return this.queueData.length == 0 ? true : false;
  }
  public size() {
    return this.queueData.length;
  }
}
