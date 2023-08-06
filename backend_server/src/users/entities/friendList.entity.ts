import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
} from 'typeorm';

@Entity('friend_list')
export class FriendList extends BaseEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @Column()
  userIdx: number;

  @Column()
  friendIdx: number;

  @Column()
  friendNickname: string;
}
