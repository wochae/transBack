import { HttpException, HttpStatus, Injectable, Logger, } from '@nestjs/common';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { JwtPayloadDto } from 'src/auth/dto/auth.dto';
import { IntraInfoDto } from 'src/users/dto/user.dto';
import { CreateUsersDto } from 'src/users/dto/create-users.dto';

import { UserObject } from 'src/entity/users.entity';
import { UsersService } from 'src/users/users.service';
import * as config from 'config';

const authConfig = config.get('auth');


export const apiUid = authConfig.clientid;
export const apiSecret = authConfig.clientsecret;
export const redirectUri = authConfig.redirecturi;
export const frontcallback = authConfig.frontcallbackuri;
export const callbackuri = authConfig.callbackuri;
export const jwtSecret = "SecretKey"


export const intraApiTokenUri = 'https://api.intra.42.fr/oauth/token';
export const intraApiMyInfoUri = 'https://api.intra.42.fr/v2/me';

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
      client_id: apiUid,
      client_secret: apiSecret,
      code: code,
      redirect_uri: frontcallback,
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
    const { userIdx, intra, imgUri, accessToken, email } = intraInfo;
    let user: UserObject | CreateUsersDto = await this.usersService.findOneUser(userIdx);
    if (user === null || user === undefined) {
      /*
        token: string;
        check2Auth: boolean;
        email: string;
        userIdx: number; 
       */
      
      this.logger.log('createUser called with : ', user);
      
    } else {return { id: userIdx, email: email };}
    
  }
}