// import { UserObject } from 'src/users/entities/users.entity';
import {
  BaseEntity,
  Entity,
  Column,
  OneToOne,
  PrimaryColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { GameRecord, RecordResult, RecordType } from './gameRecord.entity';

@Entity('gameChannel')
export class GameChannel extends BaseEntity {
  @PrimaryColumn()
  gameIdx: number;

  @Column()
  type: RecordType;

  @Column()
  userIdx1: number;

  @Column()
  userIdx2: number;

  @Column()
  score1: number;

  @Column()
  score2: number;

  @Column()
  status: RecordResult;

  //   @ManyToOne(() => UserObject, (user) => user.userGameChannelList)
  //   @JoinColumn([{ referencedColumnName: 'useridx' }])
  //   User1: UserObject;

  //   @ManyToOne(() => UserObject, (user) => user.userGameChannelList)
  //   @JoinColumn([{ referencedColumnName: 'useridx' }])
  //   User2: UserObject;

  @OneToOne(() => GameRecord, (gameIdx) => gameIdx)
  record: GameRecord;
}
