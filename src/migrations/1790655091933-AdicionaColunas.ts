import { MigrationInterface, QueryRunner } from "typeorm";

export class AdicionaColunas1790655091933 implements MigrationInterface {
    name = 'AdicionaColunas1790655091933'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "resetToken" uuid`);
        await queryRunner.query(`ALTER TABLE "user" ADD "resetTokenExp" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "resetTokenExp"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "resetToken"`);
    }

}
