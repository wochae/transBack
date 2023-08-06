import { UserObject } from 'src/users/entities/users.entity';
import {
  BaseEntity,
  Entity,
  Column,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { GameChannel } from './gameChannel.entity';

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

@Entity('gameRecord')
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

  @Column()
  type: RecordType;

  @Column()
  result: RecordResult;

  @Column()
  score: string;

  @Column()
  matchDate: Date;

  @ManyToOne(() => UserObject, (userIdx) => userIdx)
  user: UserObject;

  @ManyToOne(() => UserObject, (matchUserIdx) => matchUserIdx)
  matchUser: UserObject;

  @OneToOne(() => GameChannel, (gameIdx) => gameIdx)
  channel: GameChannel;
}
