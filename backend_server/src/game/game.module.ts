import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { UsersService } from 'src/users/users.service';

@Module({
  providers: [GameGateway, GameService],
  imports: [UsersService],
})
export class GameModule {}
