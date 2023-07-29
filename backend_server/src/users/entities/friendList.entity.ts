import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
} from 'typeorm';
import { UserObject } from './users.entity';

@Entity('friendList')
export class FriendList extends BaseEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @Column()
  userId: number;

  @Column()
  friendId: number;

  @Column()
  friendNickname: string;
}
