import {
  Entity,
  BaseEntity,
  Column,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  OneToOne,
} from 'typeorm';
import { UserObject } from './users.entity';

@Entity('certificate')
export class CertificateObject extends BaseEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @PrimaryColumn()
  userId: number;

  @Column({ default: false })
  check2Auth: boolean;

  @OneToOne(() => UserObject, (userId) => userId.userIdx)
  userObject: UserObject;
}
