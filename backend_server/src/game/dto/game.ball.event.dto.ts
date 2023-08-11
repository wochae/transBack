import { IsInt } from 'class-validator';

export class GameBallEventDto {
  @IsInt()
  ballPosX: number;
  @IsInt()
  ballPosY: number;
  @IsInt()
  ballDegreeX: number;
  @IsInt()
  ballDegreeY: number;
  @IsInt()
  ballHitDate: number;
}
