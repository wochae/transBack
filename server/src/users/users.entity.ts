import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class User extends BaseEntity {
    constructor(nickname: string) {
        super();
        this.nickname = nickname;
    }

    @PrimaryColumn()
    idx: number;

    @Column({ unique: true})
    nickname: string;

}