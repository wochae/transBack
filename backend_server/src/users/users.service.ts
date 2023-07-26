import { Injectable } from '@nestjs/common';
import { UserObjectRepository } from './users.repository';
import { CreateUsersDto } from './dto/create-users.dto';
import { create } from 'domain';

@Injectable()
export class UsersService {
  constructor(private userObjectRepository: UserObjectRepository) {}

  async signUp(createUsersDto: CreateUsersDto): Promise<string> {
    return this.userObjectRepository.createUser(createUsersDto);
  }

  async signIn(createUsersDto: CreateUsersDto): Promise<string> {
    const user = this.userObjectRepository.findOne({
      where: { intra: createUsersDto.intra },
    });
    return (await user).intra;
  }
}
