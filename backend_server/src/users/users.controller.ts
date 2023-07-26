import { Controller, ValidationPipe, Post, Body, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUsersDto } from './dto/create-users.dto';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Post('/auth')
  signUp(
    @Body(ValidationPipe) createUsersDto: CreateUsersDto,
  ): Promise<string> {
    return this.userService.signUp(createUsersDto);
  }
}
