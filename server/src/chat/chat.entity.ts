import { User } from "src/users/users.entity";
import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class Channel extends BaseEntity{
    @PrimaryGeneratedColumn()
    idx: number;

    @Column()
    channelName: string;

    @Column({nullable: true})
    onwer: number;


    // 근데 우리 비밀번호 컬럼 데이터에 저장할 때 비밀번호 암호화 처리해야함.
    @Column({nullable: true})
    password: string;

    @OneToMany(() => ChannelMember, (channelMember) => channelMember.channel)
    channelMembers: ChannelMember[];
}

@Entity()
export class ChannelMember extends BaseEntity{
    @PrimaryGeneratedColumn()
    idx: number;

    @Column()
    channelType: number;

    @ManyToOne(() => Channel, (channel) => channel.channelMembers)
    channel: Channel;

    @ManyToOne(() => User, (user) => user.channelMembers)
    user: User;
}

@Entity()
export class Message extends BaseEntity{
    @PrimaryGeneratedColumn()
    idx: number;
    
    @Column()
    channelIdx: number;

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