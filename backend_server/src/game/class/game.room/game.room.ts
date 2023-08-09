import { GameBall } from '../game.ball/game.ball';
import { GamePlayer } from '../game.player/game.player';
import { GameOptions } from '../game.options/game.options';
import { GameChannel } from 'src/entity/gameChannel.entity';
import { GameRecord } from 'src/entity/gameRecord.entity';
import { RecordResult, RecordType } from 'src/game/enum/game.type.enum';

export class GameRoom {
  public roomId: string;
  public ballList: GameBall[];
  public user1: GamePlayer | null;
  public user2: GamePlayer | null;
  public option: GameOptions | null;
  public count: number;
  private gameChannelObject: GameChannel;
  private gameRecordObject: GameRecord[];

  constructor(roomId: string) {
    this.roomId = roomId;
    this.user1 = null;
    this.user2 = null;
    this.option = null;
    this.count = 0;
    this.ballList = [];
    this.ballList.push(new GameBall());
    this.gameRecordObject = [];
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

  public setChannelObject(channel: GameChannel) {
    this.gameChannelObject = channel;
  }

  public setRecordObject(record: GameRecord) {
    this.gameRecordObject.push(record);
  }

  public saveChannelObject(
    type: RecordType,
    score1: number,
    score2: number,
    status: RecordResult,
  ): GameChannel {
    this.gameChannelObject.type = type;
    this.gameChannelObject.score1 = score1;
    this.gameChannelObject.score2 = score2;
    this.gameChannelObject.status = status;
    return this.gameChannelObject;
  }

  public saveRecordObject(
    type: RecordType,
    result: RecordResult,
    score: string,
  ): GameRecord[] {
    this.gameRecordObject[0].type = type;
    this.gameRecordObject[0].result = result;
    this.gameRecordObject[0].score = score;
    this.gameRecordObject[1].type = type;
    this.gameRecordObject[1].result = result;
    this.gameRecordObject[1].score = score;
    return this.gameRecordObject;
  }
}
