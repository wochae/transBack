import { GameBall } from '../game.ball/game.ball';
import { GamePlayer } from '../game.player/game.player';
import { GameOptions } from '../game.options/game.options';
import { GameChannel } from 'src/entity/gameChannel.entity';
import { GameRecord } from 'src/entity/gameRecord.entity';
import { RecordResult, RecordType } from 'src/game/enum/game.type.enum';
import { GameScoreDto } from 'src/game/dto/game.score.dto';

export class GameRoom {
  public roomId: string;
  public ballList: GameBall[];
  public user1: GamePlayer | null;
  public user2: GamePlayer | null;
  public option: GameOptions | null;
  public count: number;
  private gameChannelObject: GameChannel;
  private gameRecordObject: GameRecord[];
  private scoreData: GameScoreDto[];

  constructor(roomId: string) {
    this.roomId = roomId;
    this.user1 = null;
    this.user2 = null;
    this.option = null;
    this.count = 0;
    this.gameRecordObject = [];
    this.scoreData = [];
    this.ballList = [];
    this.ballList.push(new GameBall());
    this.predictBallCourse(0, 0);
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
    score1: number,
    score2: number,
    status: RecordResult,
  ): GameChannel {
    this.gameChannelObject.score1 = score1;
    this.gameChannelObject.score2 = score2;
    this.gameChannelObject.status = status;
    return this.gameChannelObject;
  }

  public saveRecordObject(
    score1: number,
    score2: number,
    result1: RecordResult,
    result2: RecordResult,
  ): GameRecord[] {
    const scoreFst = score1.toString().concat(` : ${score2.toString()}`);
    const scoreSec = score2.toString().concat(` : ${score1.toString()}`);
    this.gameRecordObject[0].result = result1;
    this.gameRecordObject[0].score = scoreFst.toString();
    this.gameRecordObject[1].result = result2;
    this.gameRecordObject[1].score = scoreSec.toString();
    return this.gameRecordObject;
  }

  public setScoreData(data: GameScoreDto): boolean {
    this.scoreData.push(data);
    if (this.scoreData.length == 1) return false;
    else return true;
  }

  public getScoreDataList(): GameScoreDto[] {
    return this.scoreData;
  }

  public getChannelObject(): GameChannel {
    return this.gameChannelObject;
  }

  public predictBallCourse(degreeX: number, degreeY: number) {
    const p1x = this.ballList[0].initX;
    const p1y = this.ballList[0].initY;
    const earlyP2x = this.ballList[0].degreeX;
    const earlyP2y = this.ballList[0].degreeY;
    const p2x = p1x + earlyP2x;
    const p2y = p1y + earlyP2y;
    let p3x, p3y;

    const a = (p2y - p1y) / (p2x - p1x);
    const b = p2y - a * p2x;

    if (p2x > 0 && p2y > 0) {
      p3y = 300;
      p3x = (p3y - b) / a;
    } else if (p2x < 0 && p2y > 0) {
      p3y = 300;
      p3x = (p3y - b) / a;
    } else if (p2x > 0 && p2y < 0) {
      p3y = -300;
      p3x = (p3y - b) / a;
    } else {
      p3y = -300;
      p3x = (p3y - b) / a;
    }
    this.ballList[0].nextX = p3x;
    this.ballList[0].nextY = p3y;
  }
}
