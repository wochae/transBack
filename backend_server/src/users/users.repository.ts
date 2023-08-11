import { Repository } from 'typeorm'; // EntityRepository 가 deprecated 되어 직접 호출함
import { UserObject } from 'src/entity/users.entity';
import { CreateUsersDto } from './dto/create-users.dto';
import { CustomRepository } from 'src/typeorm-ex.decorator';

@CustomRepository(UserObject)
export class UserObjectRepository extends Repository<UserObject> {
  async createUser(createUsersDto: CreateUsersDto): Promise<UserObject> {
    const { userIdx, intra, nickname, imgUri } = createUsersDto;

    let user = this.create({
      userIdx: userIdx,
      intra: intra,
      nickname: nickname,
      imgUri: imgUri,
      rankpoint: 0,
      isOnline: true,
      available: true,
      win: 0,
      lose: 0,
    });
    user = await this.save(user);

    return user;
  }

  async setIsOnline(user: UserObject, isOnline: boolean): Promise<boolean> {
    user.isOnline = isOnline;
    await this.update(user.userIdx, { isOnline: user.isOnline });
    return user.isOnline;
  }
}