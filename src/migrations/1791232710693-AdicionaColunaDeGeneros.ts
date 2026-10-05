import { MigrationInterface, QueryRunner } from "typeorm";

export class AdicionaColunaDeGeneros1791232710693 implements MigrationInterface {
    name = 'AdicionaColunaDeGeneros1791232710693'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "filmGenres" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "filmGenres"`);
    }

}
