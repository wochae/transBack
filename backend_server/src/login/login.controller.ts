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
import { UserObject } from 'src/entity/users.entity';
import { JwtPayloadDto } from 'src/auth/dto/auth.dto';

@Controller()
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly usersService: UsersService,
  ) {}

  private logger: Logger = new Logger('LoginController');

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
      this.logger.log('codeCallback : authHeader is undefined or null');
      this.logger.log(
        `req.headers.authorization is exist : ${req.headers.token}`,
      );
      authHeader = req.headers.token;
    } else {
      authHeader = authHeader.startsWith('Bearer')
        ? authHeader.split(' ')[1]
        : req.headers.token;
      console.log('codeCallback token : ', authHeader);
    }
    // authHeader가 존재, 즉 로그인이 되어 있는 사람이라면 로그인을 넘어가고 정보를 가져오는 걸로
    // 현재는 access_token이 존재하는지만 확인하고 있음

    // userService validate() refectoring required
    //

    let intraInfo: IntraInfoDto;

    intraInfo = await this.loginService.getIntraInfo(query.code);
    console.log(`codeCallback intraInfo : `, intraInfo);

    // accesstoken
    this.logger.log(`codeCallback token : ${intraInfo.accessToken}`);

    // 이걸로 아래의 것들을 가져온다
    const userSimpleDto = await this.usersService.validateUser(
      intraInfo.accessToken,
    );
    console.log(`codeCallback userSimpleDto : `, userSimpleDto);
    // IntraInfoDto : { userIdx, imgUri }
    // userDto : { userIdx, intra, imgUri, accessToken, email }

    const payload = { id: intraInfo.userIdx, email: intraInfo.email };
    const jwt = this.loginService.issueToken(payload);

    res.cookie('authorization', (await jwt).toString(), {
      httpOnly: true,
      path: '*',
    });
    interface Data {
      token: string;
      user: {
        userIdx: number;
        intra: string;
        imgUri: string;
        email: string;
        check2Auth: boolean;
      };
    }
    const userData: Data = {
      token: (await jwt).toString(),
      user: {
        userIdx: userSimpleDto.userIdx,
        intra: intraInfo.intra,
        imgUri: userSimpleDto.imgUri,
        email: intraInfo.email,
        check2Auth: userSimpleDto.check2Auth,
      },
    };

    console.log(`codeCallback userData : `, userData);

    console.log('success');

    return res.status(200).json(userData);
  }

  @Post('logout')
  @Header('Set-Cookie', 'Authentication=; Path=/; HttpOnly; Max-Age=0')
  logout() {
    this.logger.log('logout');
    return { message: '로그아웃 되었습니다.' };
  }
}
