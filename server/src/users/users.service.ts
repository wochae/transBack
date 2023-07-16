import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import { UserDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USERS_REPOSITORY')
    private userRepository: Repository<User>,
  ) {}
  async findUserIdxByNickname(nickname: string): Promise<number>{
    const user = await this.userRepository.findOne({
      where: [{nickname : nickname}],
    });
    return user.idx;
  }
}
