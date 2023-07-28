import {
  Entity,
  BaseEntity,
  Column,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { UserObject } from './users.entity';

@Entity('certificate')
export class CertificateObject extends BaseEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @PrimaryColumn()
  @OneToOne(() => UserObject, (userId) => userId.idx)
  userId: number;

  @Column({ default: false })
  check2Auth: boolean;
}
