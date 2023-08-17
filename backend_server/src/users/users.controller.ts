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
  Patch,
} from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from './users.service';
import { AuthService, } from 'src/auth/auth.service';
import { plainToClass } from 'class-transformer';
import { UserObject } from '../entity/users.entity';
import { AuthGuard } from 'src/auth/auth.guard';
import { UserEditprofileDto, ProfileResDto } from './dto/user.dto';
import { SendEmailDto, TFAuthDto } from './dto/tfa.dto';

@UseGuards(AuthGuard)
@Controller("users")
export class UsersController {
  constructor(
    private usersService: UsersService,
  ) { }
  private logger: Logger = new Logger('UserController');
  @Get("profile")
  async getUserProfile(@Req() req, @Res() res: Response, @Body() body: any) { // body 를 안 쓰긴 함.
    const { id: userIdx, email } = req.jwtPayload;
    try {
      const user = await this.usersService.findOneUser(userIdx);
      const userProfile: ProfileResDto =
      {
        nickname: user.nickname,
        imgUrl: user.imgUri,
        win: user.win,
        lose: user.lose,
        rank: user.rankpoint,
        email: email
      };
      return res.status(HttpStatus.OK).json(userProfile);

    } catch (err) {
      this.logger.error(err);
      return res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
    }
  }

  @Put('profile/:userNickname')
  async updateUserProfile(@Param('userNickname') userNickname: string, @Req() req, @Res() res: Response, @Body() body: any) {
    try {
      const changedNickname = body.changedNickname;

      const user = await this.usersService.findOneUser(req.jwtPayload.id);
      const changedUser: UserEditprofileDto = { userIdx: user.userIdx , userNickname: changedNickname, imgUri: user.imgUri};
      const result = await this.usersService.updateUserNick(changedUser);
      if (result) {
        console.log("success :", result)
        return res.status(HttpStatus.OK).json({ message: '유저 정보가 업데이트 되었습니다.', result });
      }
      else
        return res.status(HttpStatus.OK).json({ message: '이미 존재하는 유저 닉네임입니다.' });
    } catch (err) {
      this.logger.error(err);
      return res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
    }
  }

  @Post('second')
  async sendEmail(@Req() req, @Res() res, @Body() body: any) {
    try {
      console.log("sendEmail");
      console.log(body);
      const sendEmailDto: SendEmailDto = {userIdx: body.userIdx, email: body.email};
      await this.usersService.reqTFA(sendEmailDto);
    } catch (err) {
      this.logger.error(err);
      return { message: err.message };
    }
    return res.status(HttpStatus.OK).json({ message: '인증번호가 전송되었습니다.' });
  }

  @Get('second')
  async getTFA(@Req() req, @Res() res, @Body() body : any) {
    return this.usersService.getTFA(body.userIdx);
  }

  @Patch('second')
  async patchTFA(@Req() req, @Res() res, @Body() body: any) {
    const tfaAuthDto : TFAuthDto = { code : body.code }
    return this.usersService.patchTFA(body.userIdx, tfaAuthDto);
  }
}