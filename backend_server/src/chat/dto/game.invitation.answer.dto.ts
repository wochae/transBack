import { IsInt } from 'class-validator';

export class GameInvitationAnswerDto {
  @IsInt()
  targetUserIdx: number;

  answer: boolean;
}
