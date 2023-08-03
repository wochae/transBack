import { Repository } from 'typeorm'; // EntityRepository 가 deprecated 되어 직접 호출함
import { CustomRepository } from 'src/typeorm-ex.decorator';
import { InsertFriendDto } from './dto/insert-friend.dto';
import { FriendList } from './entities/friendList.entity';
import { UserObject } from './entities/users.entity';
import { UserObjectRepository } from './users.repository';

@CustomRepository(FriendList)
export class FriendListRepository extends Repository<FriendList> {
  async insertFriend(
    insertFriendDto: InsertFriendDto,
    user: UserObject,
    userList: UserObjectRepository,
  ): Promise<string> {
    const { targetNickname } = insertFriendDto;
    const friend = await userList.findOne({
      where: { nickname: targetNickname },
    });
    if (!friend) {
      throw new Error(`There is no name, ${targetNickname}`);
    }

    const target = this.create({
      userIdx: user.userIdx,
      friendIdx: friend.userIdx,
      friendNickname: targetNickname,
    });

    await this.save(target);

    return friend.nickname;
  }

  async getFriendList(
    userIdx: number,
    userList: UserObjectRepository,
  ): Promise<{ friendNicname: string; isOnline: boolean }[]> {
    // TODO: 더 효과적인 방법 찾아보기.
    const friendList: FriendList[] = await this.find({
      where: { userIdx: userIdx },
    });
    const members = await Promise.all(
      friendList.map(async (friend) => {
        const user = await userList.findOne({
          where: { userIdx: friend.friendIdx },
        });
        return {
          friendNicname: user.nickname,
          isOnline: user.isOnline,
        };
      }),
    );
    // 위, 아래 방식 모두 가능.
    // const testUser = await userList.findOne({ where: { userIdx: userIdx } });
    // const testMember = (await testUser).friendList;
    // const members = await Promise.all(
    //   testMember.map(async (user) => {
    //     return {
    //       friendNicname: user.friendNickname,
    //       isOnline: user.isOnline, // 이걸 접근하려면 결국, 쿼리문을 한 번 더 사용해야 됨.
    //     };
    //   }),
    // );
    return members;
  }
}
