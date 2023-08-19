import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from './configs/typeorm.config';
import { GameModule } from './game/game.module';
import { AuthModule } from './auth/auth.module';
import { LoginModule } from './login/login.module';
import { InMemoryUsers } from './users/users.provider';
import { SharedModule } from './shared/shared.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    SharedModule,
    LoginModule,
    ScheduleModule.forRoot(),

    TypeOrmModule.forRoot(typeORMConfig),
    GameModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService, InMemoryUsers],
})
export class AppModule {}
