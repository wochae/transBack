import { Injectable, NotFoundException } from '@nestjs/common';
import { BlockList } from 'src/entity/blockList.entity';
import { UserObject } from 'src/entity/users.entity';
import { UserObjectRepository } from './users.repository';
import { BlockListRepository } from './blockList.repository';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class InMemoryUsers {
  inMemoryUsers: UserObject[] = [];
  inMemoryBlockList: BlockList[] = [];

  constructor(
    private readonly userObjectRepository: UserObjectRepository,
    private readonly blockListRepository: BlockListRepository,
  ) {
    this.initInMemoryUsers();
  }

  private async initInMemoryUsers(): Promise<void> {
    const users = await this.userObjectRepository.find();
    this.inMemoryUsers = users;
    const lists = await this.blockListRepository.find();
    this.inMemoryBlockList = lists;
  }

  getUserByIntraFromIM(intra: string): UserObject {
    return this.inMemoryUsers.find((user) => user.intra === intra);
  }

  getUserByIdFromIM(userId: number): UserObject {
    return this.inMemoryUsers.find((user) => user.userIdx === userId);
  }

  async saveUserByUserIdFromIM(userId: number): Promise<UserObject | null> {
    try {
      const targetUser = this.inMemoryUsers.find(
        (user) => user.userIdx === userId,
      );
      const ret = await this.userObjectRepository.save(targetUser);
	  return ret;
    } catch (error) {
      if (error instanceof QueryFailedError)
        throw new NotFoundException(`Failed to create user: ` + error.message);
      return null;
    }
  }

  setUserByIdFromIM(updatedUser: UserObject): void {
    const userIndex = this.inMemoryUsers.findIndex(
      (user) => user.userIdx === updatedUser.userIdx,
    );
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
