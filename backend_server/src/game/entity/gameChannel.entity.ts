import { UserObject } from 'src/users/entities/users.entity';
import {
  BaseEntity,
  Entity,
  Column,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { GameRecord, RecordResult, RecordType } from './gameRecord.entity';

@Entity('gameChannel')
export class GameChannel extends BaseEntity {
  @PrimaryColumn()
  gameIdx: number;

  @Column()
  type: RecordType;

  @Column()
  userIdx1: number;

  @Column()
  userIdx2: number;

  @Column()
  score1: number;

  @Column()
  score2: number;

  @Column()
  status: RecordResult;

  @OneToOne(() => UserObject, (UserIdx1) => UserIdx1)
  User1: UserObject;

  @OneToOne(() => UserObject, (UserIdx2) => UserIdx2)
  User2: UserObject;

  @OneToOne(() => GameRecord, (gameIdx) => gameIdx)
  record: GameRecord;
}
