import { Repository } from 'typeorm';
import { GameRecord } from './entity/gameRecord.entity';
import { CustomRepository } from 'src/typeorm-ex.decorator';

@CustomRepository(GameRecord)
export class GameRecordRepository extends Repository<GameRecord> {}
