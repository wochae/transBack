import { Injectable } from '@nestjs/common';
import { GameRecordRepository } from './game.record.repository';
import { GameChannelRepository } from './game.channel.repository';
import { UserObjectRepository } from 'src/users/users.repository';

@Injectable()
export class GameService {
    constructor(
        private gameRecordRepository: GameRecordRepository,
        private gameChannelRepository: GameChannelRepository,
        private userObjectRepository: UserObjectRepository,
      ){}

      // PROFILE_INFINITY
  async getGameRecordsByInfinity(userIdx: number, page: number) {
    const skip = (page) * 3; // items per page fixed
    const records = await this.gameRecordRepository.find({
      where: { userIdx },
      order: { matchDate: 'DESC' },
      skip,
      take: 3,
    });

    return records;
  }
}
