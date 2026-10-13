import { MigrationInterface, QueryRunner } from "typeorm";

export class AdicionaIndexTmdbId1791925342530 implements MigrationInterface {
    name = 'AdicionaIndexTmdbId1791925342530'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_815ea7c68ec26aef801b60a48f" ON "user_movie"  ("tmdbId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_815ea7c68ec26aef801b60a48f"`);
    }

}
