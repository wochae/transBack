import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { UsersService } from 'src/users/users.service';
import { GameRecordRepository } from './record.repository';
import { GameChannelRepository } from './channel.repository';
import { TypeOrmExModule } from 'src/typeorm-ex.module';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      GameRecordRepository,
      GameChannelRepository,
    ]),
    UsersService,
  ],
  providers: [GameGateway, GameService],
})
export class GameModule {}
