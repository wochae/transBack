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
import { apiUid, LoginService, redirectUri } from './login.service';
import { IntraInfoDto } from 'src/users/dto/user.dto';
import { UsersService } from 'src/users/users.service';
import { plainToClass } from 'class-transformer';
import { CertificateObject } from 'src/entity/certificate.entity';
import { UserObject } from 'src/entity/users.entity';

interface Data {
  token: string;
  user: {
    userIdx: number,
    intra: string,
    imgUri: string,
    accessToken: string,
    email: string };
}

@Controller()
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly usersService: UsersService,
    ) { }

  private logger: Logger = new Logger('LoginController');
  @Get('login/42')
  @Redirect(
    `${process.env.REDIRECT_URI}`,
    301,
  )
  loginOauth() {
    this.logger.log('loginOauth');
    
    return;
  }

  @Get('login/test')
  async test(@Body() body: any) {

    const date = body.date;
    console.log(`test : ${date}`);
    return date;

  }
  @Post('login/auth')
  async codeCallback(@Headers('authorization') authHeader: any, @Req() req:Request, @Res() res: Response, @Body() query: any) {
    
    this.logger.log(`codeCallback code : ${query.code}`);
    console.log("authHeader", authHeader);
    // authHeader가 존재, 즉 로그인이 되어 있는 사람이라면 로그인을 넘어가고 정보를 가져오는 걸로
    // 현재는 access_token이 존재하는지만 확인하고 있음
    authHeader = authHeader.startsWith('Bearer') ? authHeader.split(' ')[1] : req.headers.authorization;
    console.log('codeCallback token : ', authHeader);
    if (!authHeader) {
      this.logger.log('codeCallback : authHeader is undefined or null');
      this.logger.log(`req.headers.authorization is exist : ${req.headers.authorization}`);
      // authHeader = req.headers.authorization; // 이 부분은 임시 방편이었음, authorization 이 보내줘야되는데 그거 없다면 req 안에 넣어서 보내줬을테니 ( null 이라도 ) 그걸로 대신해서 넣으려고 했음
      // authHeader 이건 뒤에 가면 토큰 값을 가지고 있음, 애초에 존재 하지 않아서 넣어준 헤더에서 꺼내서 확실하게 존재한다는 걸 보장하려고 넣은 것.
    }
      // doesn't work res:any in case 존재하지 않는 것들
    // this.logger.log(`authHeader Authorization : ${authHeader.Authorization}`);
    // this.logger.log(`authHeader Bearer : ${authHeader.token}, ${req.cookies.Authentication}`);
    // this.logger.log(`codeCallback req.cookies : ${req.cookies.token}`);
    // this.logger.log(`codeCallback req : ${req}`);
    // this.logger.log('res.cookie', res.cookie);
    // res.headers.authorization = `Authentication=${userData.token.token}; Path=/; HttpOnly; Max-Age=86400`;
    // this.logger.log(`check res.headers.cookie : ${res.headers.cookie}`);

    // this.logger.log(` res.headersSent : ${res.headersSent}`); // 이건 무슨 의미인지 모르겠음 반환 하기 전에 코드 위치로 이동해야 될 것 같다.
    
    // 요청에 대한 메시지 객체
    
    

    // 반환할 것은 access_token, 그러기 위해서 일단 유저가 존재하는지 안 하는지 확인을 해봐야 함.

    
    let intraInfo: IntraInfoDto;
    let userDto: UserObject;
    
    // 이거 그냥 토큰용으로 써야겠다. 근데 반환 값으로도 훌륭하다.
    console.log(`codeCallback query.code : ${query.code}`)
    intraInfo = await this.loginService.getIntraInfo(query.code);

    console.log(`codeCallback intraInfo : `,intraInfo);
    // this.logger.log(`codeCallback req.headers.authorization : ${req.headers.authorization}`); // find it out !
    // this.logger.log(`codeCallback Authorization check : ${req.headers.Authorization !== undefined? true: false}`);
    // this.logger.log(`codeCallback req.headers.cookie : ${req.headers.cookie}`); // undefined
    // this.logger.log(`codeCallback req.body.token : ${req.body.token}`);
    // this.logger.log(`codeCallback req.cookies.token : ${req.cookies.token}`);
    // authHeader = req.headers.authorization.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : authHeader; // 무의미
    
    // token 갱신
    const token = intraInfo.accessToken;
    
    this.logger.log(`codeCallback token : ${token}`);

    
    // 이걸로 아래의 것들을 가져온다
    userDto = await this.usersService.validateUser(token);
    console.log(`codeCallback userDto : `,userDto);
    // { userIdx, intra, imgUri, accessToken, email }
    let userData : Data;
    let user = plainToClass(IntraInfoDto, intraInfo );
    userData = {token, user};
    
    
    
    console.log(`codeCallback userData : ` ,userData.token, userData.user);
    // console.log(userDto);
    // console.log(userDto.imgUri);      
    // intraInfo = plainToClass(IntraInfoDto, userDto);
    // intraInfo.accessToken = userDto.certificate.token;
    // intraInfo.email = userDto.certificate.email;
    // intraInfo.userIdx = userDto.userIdx;
    // console.log("intraInfo",intraInfo);
    
    // const userInfo = await this.loginService.getUserInfo(intraInfo);
    // console.log("2 codeCallback userInfo",userInfo.accessToken); // userInfo.accessToken is undefined
    // const token = await this.loginService.issueToken(userInfo.id, userInfo.check2Auth);
    
    // const createdCertificateDto: CreateCertificateDto = {token:userInfo.accessToken, check2Auth: false, email: intraInfo.email, userIdx: userInfo.id};
    // userData.token = await this.usersService.saveToken(createdCertificateDto);
    
    // this.logger.log(`res.header : \n${res.header}`); // just function
    // this.logger.log(`res.headers : ${res.headers}`); // [res.headers : undefined]
    // this.logger.log('res.headers.cookie', res.headers.cookie);
    // this.logger.log(`res.headers.authorization :  ${res.headers.authorization}`);
    // this.logger.log(`res.body : ${res.body}`); // [res.body : undefined]
    res.cookie('Authentication', userData.token, { httpOnly: true, path: '*'});
    res.setHeader('Authorization', `Bearer ${userData.token}`);
    
    // resp.cookie('token', userData.token.token, { httpOnly: true, path: '/' });
    // resp.set({'code': userInfo.accessToken});

    // res.set('code', userInfo.accessToken);
    
    console.log("success");
    
    return res.status(200).json(userData);
  }

  @Post('logout')
  @Header('Set-Cookie', 'Authentication=; Path=/; HttpOnly; Max-Age=0')
  logout() {
    this.logger.log('logout');
    return { message: '로그아웃 되었습니다.' };
  }

}
