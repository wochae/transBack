import { Repository } from 'typeorm'; // EntityRepository 가 deprecated 되어 직접 호출함
import { UserObject, Histories, HistoriesType } from './entities/users.entity';
import { CreateUsersDto } from './dto/create-users.dto';
import { CreateHistoryDto } from './dto/create-history.dto';
import { CustomRepository } from 'src/typeorm-ex.decorator';

@CustomRepository(UserObject)
export class UserObjectRepository extends Repository<UserObject> {
  async createUser(createUsersDto: CreateUsersDto): Promise<string> {
    const { intra } = createUsersDto;

    const user = this.create({
      intra,
      nickname: intra,
      rankpoint: 0,
      isOnline: true,
      available: true,
      win: 0,
      lose: 0,
    });

    await this.save(user);

    return user.nickname;
  }
}

@CustomRepository(Histories)
export class HistoriesRepository extends Repository<Histories> {
  async createHistories(
    createHistoryDto: CreateHistoryDto,
    argGameId: number,
  ): Promise<Histories> {
    const { userId, type, result } = createHistoryDto;
    let histories;
    if (type == HistoriesType.NORMAL) {
      histories = this.create({
        gameId: argGameId,
        userId,
        result,
      });
    } else {
      histories = this.create({
        gameId: argGameId,
        userId,
        type,
        result,
      });
    }
    await this.save(histories);
    return histories;
  }
}
