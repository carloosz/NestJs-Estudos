import { EntitySubscriberInterface, EventSubscriber, UpdateEvent, InsertEvent, Not } from "typeorm";
import { User } from "./entities/user.entity";
import { CryptUtil } from "../../common/utils/crypt.util";

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
    listenTo() {
        return User;
    }

    async beforeInsert(event: InsertEvent<User>) {
        await this.checkEmailUniqueness(event);
        await this.hashInsertedOrUpdatedPassword(event);
    }

    async beforeUpdate(event: UpdateEvent<User>) {
        await this.checkEmailUniqueness(event);
        // await this.hashInsertedOrUpdatedPassword(event);
    }

    async checkEmailUniqueness(event: InsertEvent<User> | UpdateEvent<User>) {
        const user = event.entity;

        if (user?.email) {
            const existingUser = await event.manager.findOne(User, {
                where: {
                    email: user.email,
                    id: Not(user.id), 
                },
            });
            if (existingUser) {
                throw new Error("Email already exists");
            }
        }
    }

    async hashInsertedOrUpdatedPassword(event: InsertEvent<User> | UpdateEvent<User>) {
        const user = event.entity as User;
        await this.hashPassword(user);
        return;
    }

    async hashPassword(user: User) {
        user.salt = await CryptUtil.generateSalt();
        user.password = await CryptUtil.hashPassword(user.password, user.salt);
    }

}