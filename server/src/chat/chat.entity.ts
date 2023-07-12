import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class Channel extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    channelName: string;

    @Column({nullable: true})
    onwer: number;

    @Column({nullable: true})
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

    @Column()
    channelType: number;

    @ManyToOne(() => Channel, (channel) => channel.channelMembers)
    channel: Channel;
}

@Entity()
export class Message extends BaseEntity{
    @PrimaryGeneratedColumn()
    idx: number;
    
    @Column()
    channelId: number;

    @Column()
    sender: number;

    @Column()
    message: string;

    // date 타입 컬럼은 나중에 넣기
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