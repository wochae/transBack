import {
  BaseEntity,
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FriendList } from './friendList.entity';
import { BlockList } from './blockList.entity';

export enum HistoriesType {
  NORMAL = 'NORMAL',
  RANDOM = 'RANDOM',
}

export enum ResultType {
  DEF = 'DEFAULT',
  WIN = 'WIN',
  LOSE = 'LOSE',
}

@Entity('users')
export class UserObject extends BaseEntity {
  @PrimaryGeneratedColumn()
  @OneToMany(() => Histories, (idx) => idx.userId)
  @OneToMany(() => FriendList, (idx) => idx.userId)
  @OneToMany(() => BlockList, (idx) => idx.userId)
  idx: number;

  @Column()
  intra: string;

  @Column()
  nickname: string;

  @Column()
  rankpoint: number;

  @Column()
  isOnline: boolean;

  @Column()
  available: boolean;

  @Column()
  win: number;

  @Column()
  lose: number;
}

@Entity('histories')
export class Histories extends BaseEntity {
  @PrimaryGeneratedColumn()
  userIdx: number;

  @Column()
  gameId: number;

  @ManyToOne(() => UserObject, (userId) => userId.idx)
  userId: number;

  @Column({
    type: 'enum',
    enum: HistoriesType,
    default: HistoriesType.NORMAL,
  })
  type: HistoriesType;

  @Column({
    type: 'enum',
    enum: ResultType,
    default: ResultType.DEF,
  })
  result: ResultType;
}
