import { UserObject } from './users.entity';
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

  @Column({ type: 'int', unique: true })
  gameIdx: number;

  @Column({ type: 'int' })
  userIdx: number;

  @Column({ type: 'varchar' })
  matchUserNickname: string;

  @Column({ type: 'int' })
  matchUserIdx: number;

  @Column({ type: 'enum', enum: RecordType })
  type: RecordType;

  @Column({ type: 'enum', enum: RecordResult })
  result: RecordResult;

  @Column()
  score: string;

  @Column()
  matchDate: Date;

  @ManyToOne(() => UserObject, (user) => user)
  @JoinColumn([{ name: 'userIdx', referencedColumnName: 'userIdx' }])
  user: UserObject;

  @ManyToOne(() => UserObject, (matchUser) => matchUser)
  @JoinColumn([{ name: 'userIdx', referencedColumnName: 'userIdx' }])
  matchUser: UserObject;

  @OneToOne(() => GameChannel, (channel) => channel.record)
  @JoinColumn([{ name: 'gameIdx', referencedColumnName: 'gameIdx' }])
  channel: GameChannel;

  @ManyToOne(() => UserObject, (historyUser) => historyUser.userRecordList)
  @JoinColumn([{ name: 'userIdx', referencedColumnName: 'userIdx' }])
  historyUser: UserObject;
}
