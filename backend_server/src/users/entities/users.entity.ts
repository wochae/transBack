import {
  BaseEntity,
  Entity,
  Column,
  OneToOne,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { FriendList } from './friendList.entity';
import { BlockList } from './blockList.entity';
import { CertificateObject } from './certificate.entity';
import { DMChannel } from 'src/chat/entities/chat.entity';
import { GameRecord } from 'src/game/entity/gameRecord.entity';
import { GameChannel } from 'src/game/entity/gameChannel.entity';

@Entity('users')
export class UserObject extends BaseEntity {
  @PrimaryGeneratedColumn()
  userIdx: number;

  @Column()
  intra: string;

  @Column()
  nickname: string;

  @Column('varchar', { nullable: true })
  imgUri: string | null;

  @Column()
  rankpoint: number;

  @Column()
  isOnline: boolean;

  @Column()
  available: boolean;

  @Column({ default: 0 })
  win: number;

  @Column({ default: 0 })
  lose: number;

  @OneToOne(() => CertificateObject, (idx) => idx.userIdx)
  certificate: CertificateObject;

  @OneToMany(() => FriendList, (idx) => idx.userIdx)
  friendList: FriendList[];

  @OneToMany(() => BlockList, (userIdx) => userIdx.userIdx)
  blockedList: BlockList[];

  @OneToMany(() => DMChannel, (userIdx) => userIdx.userIdx1)
  dmChannelList: DMChannel[];

  @OneToMany(() => GameRecord, (userRecordList) => userRecordList.userIdx)
  userRecordList: GameRecord[];

  @OneToMany(
    () => GameChannel,
    (userGameChannelList) => userGameChannelList.user1,
  )
  userGameChannelList: GameChannel[];
}
