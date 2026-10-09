import { MigrationInterface, QueryRunner } from "typeorm";

export class AdicionaUserMovieEntity1791494084721 implements MigrationInterface {
    name = 'AdicionaUserMovieEntity1791494084721'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_movie" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "tmdbId" integer NOT NULL, "watchedAt" TIMESTAMP WITH TIME ZONE, "favorite" boolean NOT NULL DEFAULT false, "watchlistedAt" TIMESTAMP WITH TIME ZONE, "rating" smallint, "review" text, "ratedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_8d77b472ae64861a93594051ce3" UNIQUE ("userId", "tmdbId"), CONSTRAINT "CHK_08529dbcd0f560bd8bce62d9c2" CHECK ("rating" IS NULL OR "rating" BETWEEN 1 AND 5), CONSTRAINT "PK_2fe260b71a39352cfebb47ffa4a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_movie" ADD CONSTRAINT "FK_13836cd6ae56580075e1bd33967" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_movie" DROP CONSTRAINT "FK_13836cd6ae56580075e1bd33967"`);
        await queryRunner.query(`DROP TABLE "user_movie"`);
    }

}
