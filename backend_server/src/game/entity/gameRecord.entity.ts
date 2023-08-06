import { UserObject } from 'src/users/entities/users.entity';
import {
  BaseEntity,
  Entity,
  Column,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { GameChannel } from './gameChannel.entity';
import { type } from 'os';

export enum RecordType {
  NORMAL = 'NORMAL',
  SPECIAL = 'SPECIAL',
}

export enum RecordResult {
  PLAYING = 'PLAYING',
  WIN = 'WIN',
  LOSE = 'LOSE',
  SHUTDOWN = 'SHUTDOWN',
}

@Entity('game_record')
export class GameRecord extends BaseEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @Column()
  gameIdx: number;

  @Column()
  userIdx: number;

  @Column()
  matchUserNickname: string;

  @Column()
  matchUserIdx: number;

  @Column('smallint')
  type: RecordType;

  @Column('smallint')
  result: RecordResult;

  @Column()
  score: string;

  @Column()
  matchDate: Date;

  @ManyToOne(() => UserObject, (user) => user.userIdx)
  @JoinColumn([{ name: 'userIdx', referencedColumnName: 'userIdx' }])
  user: UserObject;

  @ManyToOne(() => UserObject, (matchUser) => matchUser.userIdx)
  @JoinColumn([{ name: 'userIdx', referencedColumnName: 'userIdx' }])
  matchUser: UserObject;

  @OneToOne(() => GameChannel, (channel) => channel.record)
  @JoinColumn()
  channel: GameChannel;

  @ManyToOne(() => UserObject, (historyUser) => historyUser.userRecordList)
  @JoinColumn([{ name: 'userIdx', referencedColumnName: 'userIdx' }])
  historyUser: UserObject;
}
