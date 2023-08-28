import { Injectable } from '@nestjs/common';
import { BlockList } from 'src/entity/blockList.entity';
import { UserObject } from 'src/entity/users.entity';
import { UserObjectRepository } from './users.repository';
import { from } from 'rxjs';

@Injectable()
export class InMemoryUsers {

  // FIXME: private 으로 바꾸기
  inMemoryUsers: UserObject[] = [];
  inMemoryBlockList: BlockList[] = [];

  constructor(private readonly userObjectRepository: UserObjectRepository, ) {
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

  setUserByIdFromIM(user: UserObject): void {
     
    // const index = this.inMemoryUsers.findIndex((u) => u.userIdx === user.userIdx);
    // const index = this.inMemoryUsers.
    console.log("targetUser :",user);
    let targetUser = this.getUserByIdFromIM(user.userIdx);
    console.log("targetUser :",targetUser);
    // console.log(`index : ${index}`);
    // console.log("inMem",this.inMemoryUsers[index].nickname);
    // console.log("user", user.nickname);
    // console.log('index', index);
    if (targetUser) {
    //   // 이미 존재하는 유저이므로 정보 업데이트
      targetUser = user;
      
    //   console.log("inMem",this.inMemoryUsers[index].nickname);
    //   console.log("user", user.nickname);
    } else {
    //   // 새로운 유저이므로 추가 // 새로운 유저가 추가되면 안된다.
    //   // this.inMemoryUsers.push(user);
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
