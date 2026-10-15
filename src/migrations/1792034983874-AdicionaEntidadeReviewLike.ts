import { MigrationInterface, QueryRunner } from "typeorm";

export class AdicionaEntidadeReviewLike1792034983874 implements MigrationInterface {
    name = 'AdicionaEntidadeReviewLike1792034983874'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "review_like" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userMovieId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "UQ_4c5d7d4aedf53c89781b43e5113" UNIQUE ("userMovieId", "userId"), CONSTRAINT "PK_d40f62b4eca95d56b89c525a0d8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "review_like" ADD CONSTRAINT "FK_1408d8754ded63370b73172b1b5" FOREIGN KEY ("userMovieId") REFERENCES "user_movie"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review_like" ADD CONSTRAINT "FK_f586f7a08d5ea44e409e61e8de5" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "review_like" DROP CONSTRAINT "FK_f586f7a08d5ea44e409e61e8de5"`);
        await queryRunner.query(`ALTER TABLE "review_like" DROP CONSTRAINT "FK_1408d8754ded63370b73172b1b5"`);
        await queryRunner.query(`DROP TABLE "review_like"`);
    }

}
