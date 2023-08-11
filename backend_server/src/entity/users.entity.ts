import {
  BaseEntity,
  Entity,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { FriendList } from './friendList.entity';
import { BlockList } from './blockList.entity';
import { CertificateObject } from './certificate.entity';
import { DMChannel } from 'src/entity/chat.entity';
import { GameRecord } from './gameRecord.entity';
import { GameChannel } from 'src/entity/gameChannel.entity';

@Entity('users')
export class UserObject extends BaseEntity {
  @PrimaryColumn({ type: 'int' })
  userIdx: number;

  @Column({ type: 'varchar', unique: true })
  intra: string;

  @Column({ type: 'varchar', unique: true })
  nickname: string;

  @Column({ type: 'varchar', nullable: true })
  imgUri: string | null;

  @Column({ type: 'int', default: 0 })
  rankpoint: number;

  @Column({ type: 'boolean', default: true })
  isOnline: boolean;

  @Column({ type: 'boolean', default: true })
  available: boolean;

  @Column({ type: 'int', default: 0 })
  win: number;

  @Column({ type: 'int', default: 0 })
  lose: number;

  @OneToOne(() => CertificateObject, (userIdx) => userIdx.userIdx, {}) // eager 옵션 오류 발생
  certificate: CertificateObject;

  @OneToMany(() => FriendList, (idx) => idx.userIdx, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  friendList: FriendList[];

  @OneToMany(() => BlockList, (userIdx) => userIdx.userIdx, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  blockedList: BlockList[];

  @OneToMany(() => DMChannel, (userIdx) => userIdx.userIdx1, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    // eager: true, // 오류
  })
  dmChannelList: DMChannel[];

  @OneToMany(() => GameRecord, (userRecordList) => userRecordList.userIdx, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  userRecordList: GameRecord[];

  @OneToMany(
    () => GameChannel,
    (userGameChannelList) => userGameChannelList.user1,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  userGameChannelList: GameChannel[];
}
