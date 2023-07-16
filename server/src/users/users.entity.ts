import { ChannelMember } from "src/chat/chat.entity";
import { BaseEntity, Column, Entity, OneToMany, PrimaryColumn } from "typeorm";

@Entity()
export class User extends BaseEntity {

    @PrimaryColumn()
    idx: number;

    @Column({ unique: true})
    intra: string;

    @Column({ unique: true})
    nickname: string;

    @OneToMany(
        () => ChannelMember,
        (channelMember) => channelMember.user,
    )
    channelMembers: ChannelMember[];
    

}