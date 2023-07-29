import {
  BaseEntity,
  Entity,
  Column,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { FriendList } from './friendList.entity';
import { BlockList } from './blockList.entity';
import { CertificateObject } from './certificate.entity';

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
  userIdx: number;

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

  @OneToOne(() => CertificateObject, (idx) => idx.userId)
  certificate: CertificateObject;

  @OneToMany(() => FriendList, (idx) => idx.userId)
  friendList: FriendList[];

  @OneToMany(() => BlockList, (userIdx) => userIdx.userIdx)
  blockedList: BlockList[];
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
