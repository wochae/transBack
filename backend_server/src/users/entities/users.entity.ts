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
import { DMChannel } from 'src/chat/entities/chat.entity';

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

  @OneToOne(() => CertificateObject, (idx) => idx.userIdx)
  certificate: CertificateObject;

  @OneToMany(() => FriendList, (idx) => idx.userIdx)
  friendList: FriendList[];

  @OneToMany(() => BlockList, (userIdx) => userIdx.userIdx)
  blockedList: BlockList[];

  @OneToMany(() => DMChannel, (userIdx) => userIdx.userIdx1)
  dmChannelList: DMChannel[];
}

// @Entity('histories')
// export class Histories extends BaseEntity {
//   @PrimaryGeneratedColumn()
//   userIdx: number;

//   @Column()
//   gameId: number;

//   @ManyToOne(() => UserObject, (userIdx) => userId.userIdx)
//   userIdx: number;

//   @Column({
//     type: 'enum',
//     enum: HistoriesType,
//     default: HistoriesType.NORMAL,
//   })
//   type: HistoriesType;

//   @Column({
//     type: 'enum',
//     enum: ResultType,
//     default: ResultType.DEF,
//   })
//   result: ResultType;
// }
