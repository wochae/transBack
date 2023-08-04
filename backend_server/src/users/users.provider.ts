import { Injectable } from '@nestjs/common';
import { UserObject } from './entities/users.entity';

@Injectable()
export class InMemoryUsers {
  inMemoryUsers: UserObject[] = [];

  getUserFromIM(intra: string): UserObject {
    return this.inMemoryUsers.find((user) => user.intra === intra);
  }
}
