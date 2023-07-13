import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from 'src/database/database.module';
import { chatProviders } from 'src/chat/chat.providers';
import { usersProviders } from './users.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, ...usersProviders, ...chatProviders],
  exports: [UsersService, ...usersProviders, ...chatProviders],
})
export class UsersModule {}
