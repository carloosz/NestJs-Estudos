import { Entity, Column, Unique, JoinColumn, ManyToOne, Check } from 'typeorm';
import { CommonEntity } from '../../../common/common.entity';
import { User } from 'src/modules/user/entities/user.entity';

@Entity('user_movie')
@Unique(['userId', 'tmdbId'])
@Check(`"rating" IS NULL OR "rating" BETWEEN 1 AND 5`)
export class UserMovie extends CommonEntity {
   @Column() userId!: string;
   @Column() tmdbId!: number;

   @Column({ type: 'timestamptz', nullable: true }) watchedAt!: Date | null;
   @Column({ default: false }) favorite!: boolean;
   @Column({ type: 'timestamptz', nullable: true }) watchlistedAt!: Date | null;

   @Column({ type: 'smallint', nullable: true }) rating!: number | null;
   @Column({ type: 'text', nullable: true }) review!: string | null;
   @Column({ type: 'timestamptz', nullable: true }) ratedAt!: Date | null;

   @ManyToOne(() => User, { onDelete: 'CASCADE' })
   @JoinColumn({ name: 'userId' })
   user!: User;
}
