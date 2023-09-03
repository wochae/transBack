import { Controller } from '@nestjs/common';
import { Get, Post, Query } from '@nestjs/common';
import { GameService } from './game.service';
import { Logger } from '@nestjs/common';
import { InMemoryUsers } from 'src/users/users.provider';
import { UsersService } from 'src/users/users.service';
import { UserProfileGameRecordDto } from './dto/game.record.dto';

@Controller('game')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly inMemoryUsers: InMemoryUsers,
    private readonly usersService: UsersService,
  ) {}
  logger: Logger = new Logger('GameContoller');

  // PROFILE_INIFINITY
  @Get('records')
  async getRecord(
    @Query('userIdx') userIdx: number,
    @Query('page') page: number,
  ) {
    console.log('getRecord', userIdx, page);
    const user = await this.usersService.findOneUser(userIdx);
    const records = await this.gameService.getGameRecordsByInfinity(
      userIdx,
      page,
    );
    const userProfileGameRecordDto: UserProfileGameRecordDto = {
      userInfo: {
        win: user.win,
        lose: user.lose,
      },
      gameList: records,
    };
    return userProfileGameRecordDto;
  }

  @Post()
  readyForPong() {}
}

@Controller('game-result')
export class GameResultController {
  @Get()
  getHistory() {}
}
