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
import { AuthService,} from 'src/auth/auth.service';
import { plainToClass } from 'class-transformer';
import { UserObject } from '../entity/users.entity';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller("users")
export class UsersController {
  constructor(
    private usersService: UsersService,
    ) {}
    private logger: Logger = new Logger('UserController');

    @Get("profile")
    async getUserProfile(@Req() req, @Res() res: Response) {
      try {
        
        const user = await this.usersService.findOneUser(req.headers.token);
        const userProfile = plainToClass(UserObject, user);
        return res.status(HttpStatus.OK).json(userProfile);
      } catch (err) {
        this.logger.error(err);
        return res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
      }
    }
}