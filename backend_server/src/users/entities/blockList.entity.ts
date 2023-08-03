import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserObject } from './users.entity';

@Entity('block_list')
export class BlockList extends BaseEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @Column()
  userIdx: number;

  @Column()
  blockedUserIdx: number;

  @Column()
  blockedNickname: string;

  @CreateDateColumn() // 해당 컬럼은 자동으로 입력됨.
  blockedTime: Date;

  @ManyToOne(() => BlockList, (idx) => idx.userIdx)
  userObjectList: UserObject[];
}
