import { Repository } from 'typeorm';
import { GameRecord } from './entity/gameRecord.entity';
import { GameChannel } from './entity/gameChannel.entity';
import { CustomRepository } from 'src/typeorm-ex.decorator';

@CustomRepository(GameChannel)
export class GameChannelRepository extends Repository<GameChannel> {}
