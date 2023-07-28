import {
  BaseEntity,
  Column,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('friendList')
export class FriendList extends BaseEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @PrimaryColumn()
  userId: number;

  @Column()
  friendId: number;
}
