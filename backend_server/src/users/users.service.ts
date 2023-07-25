import { Injectable } from '@nestjs/common';
import { UserObjectRepository } from './users.repository';
import { CreateUsersDto } from './dto/create-users.dto';
import { create } from 'domain';
import { UserObject } from './entities/users.entity';

@Injectable()
export class UsersService {
  constructor(private userObjectRepository: UserObjectRepository) {}

  async signUp(createUsersDto: CreateUsersDto): Promise<UserObject> {
    return this.userObjectRepository.createUser(createUsersDto);
  }
}
