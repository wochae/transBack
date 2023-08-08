import {
  Entity,
  BaseEntity,
  Column,
  OneToOne,
  PrimaryColumn,
  JoinColumn,
} from 'typeorm';
import { UserObject } from './users.entity';

@Entity('certificate')
export class CertificateObject extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', unique: true })
  token: string;

  @Column({ type: 'int' })
  userIdx: number;

  @Column({ type: 'boolean', default: false })
  check2Auth: boolean;

  @OneToOne(() => UserObject, (userObject) => userObject)
  @JoinColumn({ name: 'userIdx', referencedColumnName: 'userIdx' })
  userObject: UserObject;
}
