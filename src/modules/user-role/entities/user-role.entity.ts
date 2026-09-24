import { CommonEntity } from "src/common/common.entity";
import { Role } from "src/modules/role/entities/role.entity";
import { User } from "src/modules/user/entities/user.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity("user_roles")
export class UserRole extends CommonEntity {
    @Column()
    userId!: string;

    @Column()
    roleId!: string;

    @ManyToOne(() => User, (user) => user.userRoles, { onDelete: "CASCADE" })
    user!: User;

    @ManyToOne(() => Role, (role) => role.userRoles)
    role!: Role;
}
