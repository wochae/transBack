import { HttpException, HttpStatus, Injectable, Logger, } from '@nestjs/common';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { JwtPayloadDto } from 'src/auth/dto/auth.dto';
import { IntraInfoDto } from 'src/users/dto/user.dto';
import { CreateUsersDto } from 'src/users/dto/create-users.dto';

import { UserObject } from 'src/entity/users.entity';
import { UsersService } from 'src/users/users.service';

dotenv.config({
  path:
    process.env.NODE_ENV === 'dev' ? '/dev.backend.env' : '/prod.backend.env',
});

export const redirectUri = process.env.REDIRECT_URI;
export const apiUid = process.env.CLIENT_ID;
const jwtSecret = process.env.JWT_SECRET;
export const intraApiTokenUri = 'https://api.intra.42.fr/oauth/token';
const intraApiMyInfoUri = 'https://api.intra.42.fr/v2/me';

@Injectable()
export class LoginService {
  constructor(
    private readonly usersService: UsersService,
  ) {}
  private logger: Logger = new Logger('LoginService');



  async getAccessToken(code: string): Promise<any> {
    this.logger.log(`getAccessToken : code= ${code}`);
    const body = {
      grant_type: 'authorization_code',
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: code,
      redirect_uri: process.env.FRONT_CALLBACK_URI,
    };
    console.log( "body : ",body);
    try {
      const response = await axios.post(intraApiTokenUri, body);
      // console.log("trying get response from axios post : ",response) // 이건 200 성공으로 모든 정보가 담긴 response
      // this.logger.log(`getToken: response.data : ${response.data}`) // [object Object]
      // this.logger.log(`getToken: response.data.message : ${response.data.message}`) // undefined
      this.logger.log(`getAccessToken: response.data.access_token : ${response.data.access_token}`)
      return response.data.access_token;
    } catch (error) {
      // Handle error
      console.error('Error making POST request:', error.message);
      throw error;
    }
  }

  async getIntraInfo(code: string): Promise<IntraInfoDto> {

    // 여기에 헤더 bearder 가 존재하는지 확인하는 코드가 필요함
    // /* https://api.intra.42.fr/oauth/token?grant_type=authorization_code&client_id=${client_id}&client_secret=${client_secret}&code=${code}&redirect_uri=${redirect_uri} */
    // const params = new URLSearchParams();
    // params.set('grant_type', 'authorization_code');
    // params.set('client_id', process.env.CLIENT_ID);
    // params.set('client_secret', process.env.CLIENT_SECRET);
    // params.set('code', code);
    // params.set('redirect_uri', process.env.FRONT_CALLBACK_URI);
    
    // const tokens = await lastValueFrom(
    //   this.httpService.post(intraApiTokenUri, params)
    // );
    console.log("getIntraInfo: code : ",code)
    const tokens = await this.getAccessToken(code);
    console.log("tokens",tokens);
    try {
      const response = await axios.get(intraApiMyInfoUri, {
        headers: {
          Authorization: `Bearer ${tokens}`,
        },
      });
      this.logger.log(`getIntraInfo: response.data.access_token : ${response.data.access_token}`);
      this.logger.log(`getIntraInfo: but tokens : ${tokens}`);
      
      const userInfo = response.data;
      // console.log(`getIntraInfo: userInfo : `,userInfo); // too many
      // console.log('userInfo : Logging :',userInfo);
      // 이제 userInfo를 사용하여 원하는 작업을 수행할 수 있습니다.
      this.logger.log(`getIntraInfo: userInfo : ${userInfo.id}, ${userInfo.image.versions.small}`);
    
    return {
      userIdx: userInfo.id,
      intra: userInfo.login,
      imgUri: userInfo.image.versions.small,
      accessToken : tokens,
      email: userInfo.email,
    };
    } catch (error) {
      // 에러 핸들링
      console.error('Error making GET request:', error);
    }
    // httpService.get() 메서드 안에서 headers: Authorization 이 존재하는지 확인하는 코드가 필요함
    
    
  }

  
  

  async issueToken(payload: JwtPayloadDto) {
    const paytoken = jwt.sign(payload, jwtSecret);
    
    this.logger.log('paytoken', paytoken);
    return paytoken;
  }
  
  
  


  async getUserInfo(intraInfo: IntraInfoDto): Promise<JwtPayloadDto> {
    this.logger.log('getUserInfo start');
    /* 
    userIdx: number;
    intra: string;
    imgUri: string;
    accessToken: string;
    email: string; 
    */
  //  const dto = new CreateUsersDto(id, username, username, image );
    // const intrainfoDto = new IntraInfoDto( userIdx, intra, imgUri, accessToken, email );
    
    const intraInfoDto: IntraInfoDto = {
      userIdx: intraInfo.userIdx,
      intra: intraInfo.intra,
      imgUri: intraInfo.imgUri,
      accessToken: intraInfo.accessToken,
      email: intraInfo.email,
    };
    const { userIdx, intra, imgUri, accessToken, email } = intraInfoDto;
    this.logger.log(`getUserInfo : ${userIdx}, ${intra}, ${imgUri}, ${accessToken}, ${email}`);
    let user: UserObject | CreateUsersDto = await this.usersService.findOneUser(userIdx);
    if (user === null || user === undefined) {
      /*
        token: string;
        check2Auth: boolean;
        email: string;
        userIdx: number; 
      
       */
      const savedtoken = await this.usersService.saveToken({
        token: accessToken,
        check2Auth: false,
        email: email,
        userIdx: userIdx,
      });
      const newUser: CreateUsersDto = {
        userIdx : userIdx,
        intra: intra,
        nickname : intra,
        imgUri: imgUri,
        certificate: savedtoken,
        email: email,
      };
      this.logger.log(`saveToken called : ${savedtoken}`);
      // newUser.certificate = savedtoken;
      user = await this.usersService.createUser(newUser);
      this.logger.log('createUser called');
      
      
    }

    return {
      id: userIdx,
      email: email
      // accessToken: accessToken,
    };
  }
}