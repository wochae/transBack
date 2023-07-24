import { IsNotEmpty } from 'class-validator';
import { HistoriesType, ResultType } from '../entities/users.entity';

export class CreateHistoryDto {
  @IsNotEmpty()
  userId: number;
  type: HistoriesType;
  result: ResultType;
}
