import { Injectable } from '@nestjs/common';
import { GameRecordRepository } from './game.record.repository';
import { GameChannelRepository } from './game.channel.repository';
import { UserObjectRepository } from 'src/users/users.repository';
import { InMemoryUsers } from 'src/users/users.provider';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class GameService {
  constructor(
    private gameRecordRepository: GameRecordRepository,
    private gameChannelRepository: GameChannelRepository,
    private readonly userService: UsersService,
    private readonly inMemoryUsers: InMemoryUsers,
  ) {}

  // PROFILE_INFINITY
  async getGameRecordsByInfinity(userIdx: number, page: number) {
    const skip = page * 3; // items per page fixed
    const records = await this.gameRecordRepository.find({
      where: { userIdx },
      order: { matchDate: 'DESC' },
      skip,
      take: 3,
    });

    return records;
  }

  //GameOption
  //TODO: 게임 Player 작성하기
  //TODO: 큐에 넣기
  // TODO: 큐 만들기
  //TODO:
}
