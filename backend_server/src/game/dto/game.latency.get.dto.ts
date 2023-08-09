import { IsInt, IsDate } from 'class-validator';

export class GameLatencyGetDTO {
  @IsInt()
  userIdx: number;

  @IsDate()
  serverDateTime: Date;

  @IsDate()
  clientDateTime: Date;
}
