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
export class Channel extends BaseEntity {
  @PrimaryColumn()
  channelIdx: number;

  @Column()
  channelName: string;

  //   @Column({ nullable: true })
  //   onwer: number;

  // 근데 우리 비밀번호 컬럼 데이터에 저장할 때 비밀번호 암호화 처리해야함.
  //   @Column({ nullable: true })
  //   password: string;

  @OneToMany(() => ChannelMember, (channelMember) => channelMember.channel)
  channelMembers: ChannelMember[];
}

@Entity()
export class ChannelMember extends BaseEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @Column()
  userIdx: number;

  //   @Column()
  //   channelType: number;

  @ManyToOne(() => Channel, (channel) => channel.channelMembers)
  channel: Channel;
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
}
