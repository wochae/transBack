import { Injectable } from '@nestjs/common';
import { BlockList } from 'src/entity/blockList.entity';
import { UserObject } from 'src/entity/users.entity';
import { UserObjectRepository } from './users.repository';
import { from } from 'rxjs';
import { before } from 'node:test';

@Injectable()
export class InMemoryUsers {

  // FIXME: private 으로 바꾸기
  inMemoryUsers: UserObject[] = [];
  inMemoryBlockList: BlockList[] = [];

  constructor(private readonly userObjectRepository: UserObjectRepository) {
    this.initInMemoryUsers();
  }

  private initInMemoryUsers(): void {
    this.userObjectRepository.find().then((users) => {
      this.inMemoryUsers = users;
    });
  }

  getUserByIntraFromIM(intra: string): UserObject {
    return this.inMemoryUsers.find((user) => user.intra === intra);
  }

  getUserByIdFromIM(userId: number): UserObject {
    return this.inMemoryUsers.find((user) => user.userIdx === userId);
  }

  setUserByIdFromIM(updatedUser: UserObject): void {
    const userIndex = this.inMemoryUsers.findIndex(user => user.userIdx === updatedUser.userIdx);
    this.inMemoryUsers[userIndex] = updatedUser;
    if (userIndex === -1) {
      this.inMemoryUsers.push(updatedUser);
    }
  }

  getBlockListByIdFromIM(userId: number): BlockList[] {
    return this.inMemoryBlockList.filter((user) => user.userIdx === userId);
  }

  setBlockListByIdFromIM(blockList: BlockList): void {
    this.inMemoryBlockList.push(blockList);
  }


  removeBlockListByNicknameFromIM(nickname: string): void {
    this.inMemoryBlockList = this.inMemoryBlockList.filter(
      (user) => user.blockedNickname !== nickname,
    );
  }
}
