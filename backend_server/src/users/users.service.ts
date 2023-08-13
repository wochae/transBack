import { BadRequestException, Injectable } from '@nestjs/common';
import { UserObjectRepository } from './users.repository';
import { CreateUsersDto } from './dto/create-users.dto';
import { BlockInfoDto, BlockTargetDto } from './dto/block-target.dto';
import { BlockListRepository } from './blockList.repository';
import { FriendListRepository } from './friendList.repository';
import { UserObject } from 'src/entity/users.entity';
import { InsertFriendDto } from './dto/insert-friend.dto';
import { DataSource } from 'typeorm';
import { DMChannelRepository } from 'src/chat/DM.repository';

@Injectable()
export class UsersService {
  constructor(
    private dataSource: DataSource,
    private userObjectRepository: UserObjectRepository,
    private blockedListRepository: BlockListRepository,
    private friendListRepository: FriendListRepository,
    private dmChannelRepository: DMChannelRepository,
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

  async setBlock(
    targetNickname: string,
    user: UserObject,
  ): Promise<BlockInfoDto[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await this.blockedListRepository.blockTarget(
        targetNickname,
        user,
        this.userObjectRepository,
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      return;
    } finally {
      await queryRunner.release();
    }
    const blockList = await this.getBlockedList(user);
    console.log(blockList);
    const blockInfoList: BlockInfoDto[] = await Promise.all(
      blockList.map(async (resPromise) => {
        const res = await resPromise;
        return {
          userNickname: res.blockedNickname,
          userIdx: res.blockedUserIdx,
        };
      }),
    );
    return blockInfoList;
  }

  async checkBlockList(
    user: UserObject,
    target?: UserObject,
    channelIdx?: number,
  ): Promise<boolean> {
    if (target) {
      const blockList = await this.getBlockedList(user);
      const check = blockList.find(
        (res) => res.blockedUserIdx === target.userIdx,
      );
      if (check) return true;
      else return false;
    } else if (channelIdx) {
      // 내가 속한 channelIdx 로 direct_message_members 에서 타겟 찾기 -> 블락리스트에 있는지 확인
      // const target = await this.dmChannelRepository
      //   .find({
      //     where: { channelIdx: channelIdx },
      //   })
      //   .then();
      // const blockList = await this.getBlockedList(user);
      // if (check) return true;
      // else return false;
      /*
        const channel = await this.dmChannelRepository.findOne({
            where: { channelIdx: channelIdx },
            relations: ['user1', 'user2'], // Load related user objects
          });

          if (!channel) {
            // No channel found with the given channelIdx
            return false;
          }

          const targetIdx = user.userIdx === channel.userIdx1 ? channel.userIdx2 : channel.userIdx1;

          const blockList = await this.getBlockedList(user); // Assuming this function gets the block list

          const isBlocked = blockList.some((blockedUser) => blockedUser.userIdx === targetIdx);

          return isBlocked;
      */
    }
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

  async getUserInfoFromDBById(userId: number): Promise<UserObject> {
    return this.userObjectRepository.findOne({ where: { userIdx: userId } });
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

  async getBlockedList(user: UserObject) {
    return await this.blockedListRepository.find({
      where: { userIdx: user.userIdx },
    });
  }

  async setIsOnline(user: UserObject, isOnline: boolean) {
    // user.isOnline = isOnline;
    return this.userObjectRepository.setIsOnline(user, isOnline);
  }

  async getUserObjectFromDB(idValue: number): Promise<UserObject> {
    return this.userObjectRepository.findOne({ where: { userIdx: idValue } });
  }

  // async getUserId(client: Socket): Promise<number> {
  //   return parseInt(client.handshake.query.userId as string, 10);
  // }
}
