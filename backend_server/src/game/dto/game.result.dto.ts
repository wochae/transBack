import { GameRecord } from 'src/entity/gameRecord.entity';

export class GameResultDto {
  user1Idx: number;
  User2Nickname: string;
  user2Idx: number;
  score: string;

  constructor(data: GameRecord) {
    this.user1Idx = data.userIdx;
    this.User2Nickname = data.matchUserNickname;
    this.user2Idx = data.matchUserIdx;
    this.score = data.score;
  }
}
