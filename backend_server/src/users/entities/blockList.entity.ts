import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('BlockList')
export class BlockList extends BaseEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @PrimaryColumn()
  userId: number;

  @Column()
  blockUserId: number;

  @CreateDateColumn()
  blockedTime: Date;
}
