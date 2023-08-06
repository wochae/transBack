import { channel } from 'diagnostics_channel';
import { UserObject } from 'src/users/entities/users.entity';
import {
  BaseEntity,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  OneToOne,
  ManyToOne,
} from 'typeorm';

export enum Mode {
  PRIVATE = 'private',
  PUBLIC = 'public',
  PROTECTED = 'protected',
}

@Entity('direct_message_members')
export class DMChannel extends BaseEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @Column()
  userIdx1: number;

  @Column()
  userIdx2: number;

  @Column()
  userNickname1: string;

  @Column()
  userNickname2: string;

  @Column()
  channelIdx: number;

  @OneToMany(() => DirectMessage, (channelIdx) => channelIdx.channelIdx)
  targetChannelMessages: DirectMessage[];

  @OneToOne(() => UserObject, (userIdx1) => userIdx1)
  user1: UserObject;

  @OneToOne(() => UserObject, (userIdx2) => userIdx2)
  user2: UserObject;
}

@Entity('direct_message')
export class DirectMessage extends BaseEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @Column()
  channelIdx: number;

  @Column()
  sender: string;

  @Column()
  msg: string;

  @Column()
  msgDate: Date;

  @ManyToOne(() => DMChannel, (channelIdx) => channelIdx.channelIdx)
  channel: DMChannel;
}
