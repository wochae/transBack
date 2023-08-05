import { BadRequestException, Injectable } from '@nestjs/common';
import { UserObjectRepository } from './users.repository';
import { CreateUsersDto } from './dto/create-users.dto';
import { BlockTargetDto } from './dto/block-target.dto';
import { BlockListRepository } from './blockList.repository';
import { FriendListRepository } from './friendList.repository';
import { UserObject } from './entities/users.entity';
import { InsertFriendDto } from './dto/insert-friend.dto';
import { Socket } from 'socket.io';

@Injectable()
export class UsersService {
  constructor(
    private userObjectRepository: UserObjectRepository,
    private blockedListRepository: BlockListRepository,
    private friendListRepository: FriendListRepository,
  ) {}

  async signUp(createUsersDto: CreateUsersDto): Promise<string> {
    const { intra } = createUsersDto;
    const check = await this.userObjectRepository.findOne({ where: { intra } });

    if (check != null && check != undefined)
      throw new BadRequestException('This is not unique id');
    else return await this.userObjectRepository.createUser(createUsersDto);
  }

  async signIn(createUsersDto: CreateUsersDto): Promise<string> {
    const { intra } = createUsersDto;
    const user = await this.userObjectRepository.findOne({
      where: { intra: intra },
    });
    if (user === null || user === undefined) {
      throw new BadRequestException('You need to sign up, first');
    }
    return (await user).intra;
  }

  async blockTarget(
    blockTarget: BlockTargetDto,
    user: UserObject,
  ): Promise<string> {
    return this.blockedListRepository.blockTarget(
      blockTarget,
      user,
      this.userObjectRepository,
    );
  }

  async addFriend(
    insertFriendDto: InsertFriendDto,
    user: UserObject,
  ): Promise<string> {
    return this.friendListRepository.insertFriend(
      insertFriendDto,
      user,
      this.userObjectRepository,
    );
  }

  async getAllUsersFromDB(): Promise<UserObject[]> {
    return this.userObjectRepository.find();
  }

  async getUserInfoFromDB(intra: string): Promise<UserObject> {
    return this.userObjectRepository.findOne({ where: { intra: intra } });
  }

  async getFriendList(
    intra: string,
  ): Promise<{ friendNicname: string; isOnline: boolean }[]> {
    const user: UserObject = await this.userObjectRepository.findOne({
      where: { intra: intra },
    });
    return this.friendListRepository.getFriendList(
      user.userIdx,
      this.userObjectRepository,
    );
  }

  async getBlockedList(intra: string) {
    const user: UserObject = await this.userObjectRepository.findOne({
      where: { intra: intra },
    });
    return this.blockedListRepository.getBlockedList(user);
  }

  async setIsOnline(user: UserObject, isOnline: boolean) {
    // user.isOnline = isOnline;
    return this.userObjectRepository.setIsOnline(user, isOnline);
  }

  // async getUserId(client: Socket): Promise<number> {
  //   return parseInt(client.handshake.query.userId as string, 10);
  // }
}
