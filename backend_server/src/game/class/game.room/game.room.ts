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
    if (degreeX == 0 && degreeY == 0) {
      //TODO: 최초 경로 예측(있는자료로)
    }
    //TODO: 볼경로 예측
    //TODO: 볼 벽 부딪히면 다음 볼 경로 계산
  }
}
