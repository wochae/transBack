import {
  Controller,
  ValidationPipe,
  Post,
  Body,
  BadRequestException,
  Redirect,
  Get,
  Res,
  Query,
  Logger,
  UseGuards,
  Headers,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUsersDto } from './dto/create-users.dto';
import { AuthService,} from 'src/auth/auth.service';
import { plainToClass } from 'class-transformer';
import { UserObject } from '../entity/users.entity';


@Controller("users")
export class UsersController {
  constructor(
    private usersService: UsersService,
    ) {}
    private logger: Logger = new Logger('UserController');

    @Get("profile")
    async getUserProfile(@Headers('authorization') authHeader: any, @Req() req, @Res() res: Response) {
      try {
        authHeader = authHeader.startsWith('Bearer') ? authHeader.split(' ')[1] : req.headers.authorization;
        const user = await this.usersService.getTokenInfo(authHeader);
        const userProfile = await this.usersService.findOneUser(user.userIdx);
        return res.status(HttpStatus.OK).json(userProfile);
      } catch (err) {
        this.logger.error(err);
        return res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
      }
    }
}