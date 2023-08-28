import { Injectable } from '@nestjs/common';
import { BlockList } from 'src/entity/blockList.entity';
import { UserObject } from 'src/entity/users.entity';

@Injectable()
export class InMemoryUsers {
  // FIXME: private 으로 바꾸기
  inMemoryUsers: UserObject[] = [];
  inMemoryBlockList: BlockList[] = [];

  getUserByIntraFromIM(intra: string): UserObject {
    return this.inMemoryUsers.find((user) => user.intra === intra);
  }

  getUserByIdFromIM(userId: number): UserObject {
    return this.inMemoryUsers.find((user) => user.userIdx === userId);
  }

  setUserByIdFromIM(user: UserObject): void {
    const index = this.inMemoryUsers.findIndex((u) => u.userIdx === user.userIdx);
  
    if (index !== -1) {
      // 이미 존재하는 유저이므로 정보 업데이트
      this.inMemoryUsers[index] = user;
      console.log(this.inMemoryUsers);
    } else {
      // 새로운 유저이므로 추가 // 새로운 유저가 추가되면 안된다.
      // this.inMemoryUsers.push(user);
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
