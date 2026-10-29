import { MigrationInterface, QueryRunner } from "typeorm";

export class AdicionaColunaRuntime1793316609830 implements MigrationInterface {
    name = 'AdicionaColunaRuntime1793316609830'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_movie" ADD "runtime" smallint`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_movie" DROP COLUMN "runtime"`);
    }

}
