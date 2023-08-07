import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from './configs/typeorm.config';
import { GameModule } from './game/game.module';
import { InMemoryUsers } from './users/users.provider';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeORMConfig),
    ChatModule,
    UsersModule,
    GameModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService, InMemoryUsers],
})
export class AppModule {}
