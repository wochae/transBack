import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { JwtPayloadDto } from 'src/auth/dto/auth.dto';
import { Request } from 'express';
import { Socket } from 'socket.io';
import { jwtSecret } from 'src/login/login.service';

dotenv.config({
  path:
    process.env.NODE_ENV === 'dev' ? '/dev.backend.env' : '/prod.backend.env',
});



@Injectable()
export class AuthService {
  verify(jwtString: string) {
    try {
      const payload: JwtPayloadDto = jwt.verify(jwtString, jwtSecret) as (
        | jwt.JwtPayload
        | string
      ) &
        JwtPayloadDto;
      return payload;
    } catch (e) {
      console.log('auth.service: throw');
      throw new UnauthorizedException();
    }
  }

  validateRequest(request: Request): boolean {
    const token = request.headers.authorization;
    if (token === undefined || token === null) {
      console.log(`auth.guard: invalid user`);
      return false;
    }
    const jwtString = token.split('Bearer ')[1];
    const payload = this.verify(jwtString);
    (request as any).jwtPayload = payload;
    console.log("auth.service: validateRequest: true");
    return true;
  }

  validateSocket(client: Socket): boolean {
    const token = this.getToken(client);
    if (token === undefined || token === null) {
      console.log(`auth.guard: invalid user`);
      return false;
    }
    this.verify(token as string);
    return true;
  }

  private getToken(client: Socket) {
    const { token } = client.handshake.auth;
    return token;
  }
}