import { UserObject } from 'src/users/entities/users.entity';
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

  @ManyToOne(() => UserObject, (user1) => user1.userGameChannelList)
  @JoinColumn([{ name: 'userIdx1', referencedColumnName: 'userIdx' }])
  user1: UserObject;

  @ManyToOne(() => UserObject, (user2) => user2.userGameChannelList)
  @JoinColumn([{ name: 'userIdx2', referencedColumnName: 'userIdx' }])
  user2: UserObject;

  @OneToOne(() => GameRecord, (record) => record.channel)
  record: GameRecord;
}
