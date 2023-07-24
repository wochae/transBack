import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ChannelMember extends BaseEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @Column()
  userIdx1: number;

  @Column()
  userIdx2: number;

  @OneToMany(() => Messages, (message) => message.channelMember)
  messages: Messages[];
}

@Entity()
export class Messages extends BaseEntity {
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

  @ManyToOne(() => ChannelMember, (channelMember) => channelMember.messages)
  channelMember: ChannelMember;
}
