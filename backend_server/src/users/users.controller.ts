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
  Put,
  Param,
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
    async getUserProfile(@Req() req, @Res() res: Response, @Body() body: any) {
      try {
        const { userNickname, userIdx } = body;
        const user = await this.usersService.findOneUser(userIdx);
        const userProfile = plainToClass(UserObject, user);
        return res.status(HttpStatus.OK).json(userProfile);
      } catch (err) {
        this.logger.error(err);
        return res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
      }
    }

    @Put('profile/:userNickname')
    async updateUserProfile(@Param() userNickname : string, @Res() res: Response, @Body() body: any) {
      try {
        console.log(body);
        console.log(userNickname);
        const user = await this.usersService.findOneUser(body.userIdx);
        console.log("user.nickname, userNickname ",user.nickname , userNickname.valueOf());
        // if (body.nickname === userNickname) { // 해당 유저가 맞고, 닉네임이 같다면
          if (await this.usersService.updateOneUser(body))
            return res.status(HttpStatus.OK).json({ message: '유저 정보가 업데이트 되었습니다.' });
          else
            return res.status(HttpStatus.OK).json({ message: '이미 존재하는 유저 닉네임입니다.' });
        // } else { // 해당 유저의 닉네임이 다르다면
          throw new BadRequestException('해당 유저가 존재하지 않습니다.');
        // }
        
      } catch (err) {
        this.logger.error(err);
        return res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
      }
    }
}