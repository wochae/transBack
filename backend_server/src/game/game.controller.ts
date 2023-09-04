import { Controller } from '@nestjs/common';
import { Get, Post, Query, Body, HttpStatus, Req, Res } from '@nestjs/common';
import { GameService } from './game.service';
import { UserProfileGameRecordDto } from './dto/game.record.dto';
import { GameOptionDto } from './dto/game.option.dto';
import { UsersService } from 'src/users/users.service';
import { LoggerWithRes } from 'src/shared/class/shared.response.msg/shared.response.msg';

@Controller('game')
export class GameController {
  messanger: LoggerWithRes = new LoggerWithRes('GameController');

  constructor(
    private readonly gameService: GameService,
    private readonly usersService: UsersService, // private readonly inMemoryUsers: InMemoryUsers,
  ) {
    this.messanger.logWithMessage(
      'GameCostructor',
      'GameController',
      'Initialized!',
    );
  }

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
  async postGameOptions(@Req() req, @Res() res, @Body() option: GameOptionDto) {
    const message = '플레이어가 큐에 등록 되었습니다.';
    const errorMessage = '플레이어가 큐에 등록되지 못하였습니다.';
    let status: boolean;
    const target = await this.gameService.makePlayer(option);
    if (target === null) status = false;
    else {
      this.gameService.putInQueue(target);
      status = true;
    }
    if (status === false)
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(errorMessage);
    return res.status(HttpStatus.OK).json(message);
  }
}

// @Controller('game-result')
// export class GameResultController {
//   @Get()
//   getHistory() {}
// }
