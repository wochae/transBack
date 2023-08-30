import { Controller } from '@nestjs/common';
import { Get, Post } from '@nestjs/common';
import { GameService } from './game.service';
import { Logger } from '@nestjs/common';

@Controller('game')
export class GameController {
  constructor(private gameService: GameService) {}
  logger: Logger = new Logger('GameContoller');

  @Post()
  readyForPong() {}
}

@Controller('game-result')
export class GameResultController {
  @Get()
  getHistory() {}
}
