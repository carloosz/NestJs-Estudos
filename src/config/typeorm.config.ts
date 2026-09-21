import { registerAs } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { UserSubscriber } from "src/modules/user/users.subscriber";

export const typeormConfig = registerAs(
    "TYPEORM_MODULE_CONFIG",
    (): TypeOrmModuleOptions => {
            return {
                type: "postgres",
                url: process.env.DATABASE_URL || "postgres://postgres:postgre@localhost:5432/nestjs",
                entities: [__dirname + "/**/*.entity{.ts,.js}"],
                synchronize: true,
                autoLoadEntities: true,
                logging: true,
                logger: "file",
                subscribers: [UserSubscriber],
                migrations: [__dirname + "/migrations/**/*{.ts,.js}"],
                migrationsRun: true,
                migrationsTableName: "migrations",
            }
    }
)