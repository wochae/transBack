import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { GameRecord } from './entity/gameRecord.entity';
import { GameChannel } from './entity/gameChannel.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { GameRecordRepository } from './game.record.repository';
import { GameChannelRepository } from './game.channel.repository';

@Injectable()
export class GameService {
  constructor(
    private gameRecordRepository: GameRecordRepository,
    private gameChannelRepository: GameChannelRepository,
  ) {}
}
