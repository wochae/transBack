import { Injectable } from '@nestjs/common';
import { chatGetProfileDto } from 'src/chat/dto/chat.dto';

@Injectable()
export class UsersService {
  async getProfile(targetNickname: string): Promise<chatGetProfileDto> {
    const userProfile = new chatGetProfileDto( targetNickname, 'img', 0, [], false );
    return userProfile;
  }
}

