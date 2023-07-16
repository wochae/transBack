import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class User extends BaseEntity {

    @PrimaryColumn()
    idx: number;

    @Column({ unique: true})
    intra: string;

    @Column({ unique: true})
    nickname: string;

    

}