import { Injectable } from '@nestjs/common';
import { UserObject } from './entities/users.entity';

@Injectable()
export class InMemoryUsers {
  inMemoryUsers: UserObject[] = [];

  getUserByIntraFromIM(intra: string): UserObject {
    return this.inMemoryUsers.find((user) => user.intra === intra);
  }

  getUserByIdFromIM(userId: number): UserObject {
    return this.inMemoryUsers.find((user) => user.userIdx === userId);
  }
}
