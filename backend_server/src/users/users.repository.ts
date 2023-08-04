import { Repository } from 'typeorm'; // EntityRepository 가 deprecated 되어 직접 호출함
import { UserObject } from './entities/users.entity';
import { CreateUsersDto } from './dto/create-users.dto';
import { CustomRepository } from 'src/typeorm-ex.decorator';

@CustomRepository(UserObject)
export class UserObjectRepository extends Repository<UserObject> {
  async createUser(createUsersDto: CreateUsersDto): Promise<string> {
    const { intra } = createUsersDto;

    const user = this.create({
      intra: intra,
      nickname: intra,
      rankpoint: 0,
      imgUri: 'https://cdn.intra.42.fr/users/medium_default.png',
      isOnline: true,
      available: true,
      win: 0,
      lose: 0,
    });

    await this.save(user);

    return user.intra;
  }

  async setIsOnline(user: UserObject, isOnline: boolean): Promise<boolean> {
    user.isOnline = isOnline;
    await this.update(user.userIdx, { isOnline: user.isOnline });
    return user.isOnline;
  }
}

// @CustomRepository(Histories)
// export class HistoriesRepository extends Repository<Histories> {
//   async createHistories(
//     createHistoryDto: CreateHistoryDto,
//     argGameId: number,
//   ): Promise<Histories> {
//     const { userIdx, type, result } = createHistoryDto;
//     let histories;
//     if (type == HistoriesType.NORMAL) {
//       histories = this.create({
//         gameId: argGameId,
//         userIdx,
//         result,
//       });
//     } else {
//       histories = this.create({
//         gameId: argGameId,
//         userIdx,
//         type,
//         result,
//       });
//     }
//     await this.save(histories);
//     return histories;
//   }
// }
