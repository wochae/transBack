import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { GameRecordRepository } from './game.record.repository';
import { GameChannelRepository } from './game.channel.repository';
import { TypeOrmExModule } from 'src/typeorm-ex.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    // TypeOrmModule.forFeature([GameRecordRepository, GameChannelRepository]),
    TypeOrmExModule.forCustomRepository([
      GameRecordRepository,
      GameChannelRepository,
    ]),
    UsersModule,
  ],
  providers: [GameGateway, GameService],
  exports: [GameModule],
})
export class GameModule {}
