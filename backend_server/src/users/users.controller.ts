import {
  Controller,
  ValidationPipe,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUsersDto } from './dto/create-users.dto';

@Controller()
export class UsersController {
  constructor(private userService: UsersService) {}

  @Post('/auth')
  signUp(
    @Body(ValidationPipe) createUsersDto: CreateUsersDto,
  ): Promise<string> {
    const data = this.userService.signUp(createUsersDto);

    if (data === null) {
      throw new BadRequestException('this is not unique intra');
    }

    return data;
  }

  @Post('/auth/login')
  signIn(
    @Body(ValidationPipe) createUsersDto: CreateUsersDto,
  ): Promise<string> {
    return this.userService.signIn(createUsersDto);
  }
}
