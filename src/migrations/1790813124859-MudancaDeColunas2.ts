import { MigrationInterface, QueryRunner } from "typeorm";

export class MudancaDeColunas21790813124859 implements MigrationInterface {
    name = 'MudancaDeColunas21790813124859'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_d6e8ecf5a7a4793568b2f6e0c9a"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "nickname" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_d6e8ecf5a7a4793568b2f6e0c9a" UNIQUE ("nickname", "email")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_d6e8ecf5a7a4793568b2f6e0c9a"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "nickname" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_d6e8ecf5a7a4793568b2f6e0c9a" UNIQUE ("email", "nickname")`);
    }

}
