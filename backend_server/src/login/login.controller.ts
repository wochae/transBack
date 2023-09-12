import {
  Controller,
  Post,
  Get,
  Headers,
  Res,
  Req,
  Query,
  Redirect,
  Body,
  UseGuards,
  Logger,
  Header,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';
import { LoginService } from './login.service';
import { IntraInfoDto } from 'src/users/dto/user.dto';
import { UsersService } from 'src/users/users.service';
import { plainToClass } from 'class-transformer';
import { CertificateObject } from 'src/entity/certificate.entity';
import { OnlineStatus, UserObject } from 'src/entity/users.entity';
import { IntraSimpleInfoDto, JwtPayloadDto } from 'src/auth/dto/auth.dto';
import { LoggerWithRes } from 'src/shared/class/shared.response.msg/shared.response.msg';
const backenduri = process.env.BACKEND;

@Controller()
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly usersService: UsersService,
  ) {}

  private logger: Logger = new Logger('LoginController');
  private messanger: LoggerWithRes = new LoggerWithRes('LoginController');

  @Post('login/auth')
  async codeCallback(
    @Headers('token') authHeader: any,
    @Req() req: Request,
    @Res() res: Response,
    @Body() query: any,
  ) {
    this.logger.log(`codeCallback code : ${query.code}`);
    console.log('authHeader', authHeader);
    if (!authHeader) {
      authHeader = req.headers.token;
    } else {
      authHeader = authHeader.startsWith('Bearer')
        ? authHeader.split(' ')[1]
        : req.headers.token;
      console.log('codeCallback token : ', authHeader);
    }
    let intraInfo: IntraInfoDto;
    let intraSimpleInfoDto: IntraSimpleInfoDto;
    intraInfo = await this.loginService.getIntraInfo(query.code);
    const user = await this.usersService.findOneUser(intraInfo.userIdx);
    
    console.log('codeCallback user : ', user);
    if (!user) {
      console.log('codeCallback user not exist : ', user);
      intraSimpleInfoDto = await this.usersService.validateUser(intraInfo);
      this.loginService.downloadProfileImg(intraInfo);
    } else {
      if (user.isOnline !== OnlineStatus.OFFLINE) {
        console.log('codeCallback user already online : ');
        return res.status(400).json({ message: '이미 로그인 되어있습니다.' });
      }
      user.imgUri = `${backenduri}/img/${user.userIdx}.png`
      this.usersService.setUserImg(user.userIdx, user.imgUri);
      
      console.log('codeCallback user exist : ', user);
      intraSimpleInfoDto = new IntraSimpleInfoDto(user.userIdx, user.nickname, user.imgUri, user.check2Auth, user.available);
    }
    const anyImg = await this.usersService.checkFileExists(`public/img/${intraSimpleInfoDto.userIdx}.png`);
    if (!anyImg && !intraSimpleInfoDto.imgUri)
    {
      intraSimpleInfoDto.imgUri = `${backenduri}/img/0.png`;
      await this.usersService.setUserImg(intraSimpleInfoDto.userIdx, intraSimpleInfoDto.imgUri);
    }
    const payload = { id: intraInfo.userIdx, email: intraInfo.email };
    const jwt = await this.loginService.issueToken(payload);
    intraInfo.token = (jwt).toString();
    intraInfo.check2Auth = intraSimpleInfoDto.check2Auth;
    intraInfo.imgUri = intraSimpleInfoDto.imgUri;
    intraInfo.nickname = intraSimpleInfoDto.nickname;
    intraInfo.available = intraSimpleInfoDto.available;
    const settedUser = await this.usersService.findOneUser(intraInfo.userIdx);
    this.usersService.setIsOnline(user, OnlineStatus.ONLINE);

    res.cookie('authorization', intraInfo.token, { httpOnly: true, path: '*' });
    res.header('Cache-Control', 'no-store');
    // res.setHeader('Authorization', `Bearer ${intraInfo.token}`);
    console.log(`codeCallback intraInfo : `, intraInfo);

    console.log("success");

    return res.status(200).json(intraInfo);
  }

  @Post('logout')
  @Header('Set-Cookie', 'Authentication=; Path=/; HttpOnly; Max-Age=0')
  logout() {
    this.logger.log('logout');
    return { message: '로그아웃 되었습니다.' };
  }
}
