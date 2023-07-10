import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from './configs/typeorm.config';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeORMConfig),
    ChatModule,
    DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
