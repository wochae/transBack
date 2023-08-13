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
  @PrimaryColumn({ type: 'int' })
  userIdx: number;

  @Column({ type: 'varchar', unique: true })
  token: string;

  @Column({ type: 'boolean', default: false })
  check2Auth: boolean;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email: string;

  @OneToOne(() => UserObject, (userObject) => userObject) // 이거 cascade 로 테스트 해봐야하는 것
  @JoinColumn({ name: 'userIdx', referencedColumnName: 'userIdx' })
  userObject: UserObject;
}
