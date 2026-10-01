import { MigrationInterface, QueryRunner } from "typeorm";

export class MudancaDeColunas1790812774756 implements MigrationInterface {
    name = 'MudancaDeColunas1790812774756'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_f4ca2c1e7c96ae6e8a7cca9df80"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "username"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "firstName"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "name" citext`);
        await queryRunner.query(`ALTER TABLE "user" ADD "nickname" citext`);
        await queryRunner.query(`ALTER TABLE "user" ADD "bio" text`);
        await queryRunner.query(`ALTER TABLE "user" ADD "location" text`);
        await queryRunner.query(`ALTER TABLE "user" ADD "socialmedia" text`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_d6e8ecf5a7a4793568b2f6e0c9a" UNIQUE ("nickname", "email")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_d6e8ecf5a7a4793568b2f6e0c9a"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "socialmedia"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bio"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "nickname"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "lastName" citext`);
        await queryRunner.query(`ALTER TABLE "user" ADD "firstName" citext`);
        await queryRunner.query(`ALTER TABLE "user" ADD "username" citext NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_f4ca2c1e7c96ae6e8a7cca9df80" UNIQUE ("username", "email")`);
    }

}
