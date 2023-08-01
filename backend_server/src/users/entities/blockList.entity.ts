import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('blockList')
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
}
