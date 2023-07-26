import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('direct_message_members')
export class DirectMessageMembers extends BaseEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @Column()
  userIdx1: number;

  @Column()
  userIdx2: number;

  @OneToMany(() => DirectMessages, (message) => message.channelMember)
  messages: DirectMessages[];
}

@Entity('direct_messages')
export class DirectMessages extends BaseEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @Column()
  channelIdx: number;

  @Column()
  sender: number;

  @Column()
  msg: string;

  @Column()
  msgDate: Date;

  @ManyToOne(
    () => DirectMessageMembers,
    (channelMember) => channelMember.messages,
  )
  channelMember: DirectMessageMembers;
}
