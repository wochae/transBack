import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

@Injectable()
export class GameService {
  constructor(
    private gameRecordRepository: Repository<GameRecord>,
    private gameRoomRepository: Repository<GameRoom>,
  ) {}
}
