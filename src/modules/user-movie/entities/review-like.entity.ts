import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { CommonEntity } from '../../../common/common.entity';
import { UserMovie } from './user-movie.entity';
import { User } from '../../user/entities/user.entity';

@Entity('review_like')
@Unique(['userMovieId', 'userId'])
export class ReviewLike extends CommonEntity {
  @Column() userMovieId!: string;
  @ManyToOne(() => UserMovie, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userMovieId' })
  userMovie!: UserMovie;

  @Column() userId!: string; // quem curtiu
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
