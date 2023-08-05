import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { GameRecordRepository } from './game.repository';
import { GameChannelRepository } from './channel.repository';
import { TypeOrmExModule } from 'src/typeorm-ex.module';
import { UsersModule } from 'src/users/users.module';
import { UserObjectRepository } from 'src/users/users.repository';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      GameRecordRepository,
      GameChannelRepository,
      UserObjectRepository,
    ]),
    UsersModule,
  ],
  //   controllers: [GameController],
  providers: [GameGateway, GameService],
  //   exports: [GameModule],
})
export class GameModule {}
