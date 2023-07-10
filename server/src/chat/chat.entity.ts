import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class Channel extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    channelName: string;

    @Column()
    onwer: number;

    @Column()
    password: string;

    @OneToMany(() => ChannelMember, (channelMember) => channelMember.channel)
    channelMembers: ChannelMember[];
}

@Entity()
export class ChannelMember extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userIdx: number;

    @ManyToOne(() => Channel, (channel) => channel.channelMembers)
    channel: Channel;
}

@Entity()
export class Message extends BaseEntity{
    @PrimaryGeneratedColumn()
    idx: number;
    
    @Column()
    channelIdx: number;

    @Column()
    permission: number;

    @Column()
    channelType: number;
    
    @Column()
    mutedTime: Date;
}

// joinedChannel, channel, message
/*
@Entity()
export class Board extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  status: BoardStatus;

  @ManyToOne((type) => User, (user) => user.boards, { eager: false })
  user: User;
}
*/