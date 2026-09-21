import { Entity } from 'typeorm';
import { UserInterface } from '../interfaces/index';
import { Unique } from 'typeorm';
import { CommonEntity } from '../../../common/common.entity';
import { Column, OneToMany } from 'typeorm';
import { UserRole } from 'src/modules/user-role/entities/user-role.entity';

@Entity()
@Unique(['username', 'email'])
export class User extends CommonEntity implements UserInterface {
    @Column({ type: 'citext', nullable: false })
    username!: string;

    @Column({ type: 'text', nullable: false })
    password!: string;

    @Column({ type: 'text', nullable: false, default: 'salt' })
    salt!: string;

    @Column({ type: 'citext', nullable: true })
    firstName!: string;
    
    @Column({ type: 'citext', nullable: true })
    lastName!: string;

    @Column({ type: 'citext', nullable: false })
    email!: string;

    @Column({ type: 'boolean', nullable: false, default: true })
    active!: boolean;

    @OneToMany(() => UserRole, (userRole) => userRole.user, {
        cascade: true
    })
    userRoles!: UserRole[];
}
