import {
   Column,
   Entity,
   Index,
   JoinColumn,
   ManyToOne,
   Unique,
   Check,
} from 'typeorm';
import { CommonEntity } from 'src/common/common.entity';
import { User } from 'src/modules/user/entities/user.entity';

@Entity('follow')
@Unique(['followerId', 'followingId'])
@Index(['followingId'])
@Check(`"followerId" <> "followingId"`)
export class Follow extends CommonEntity {
   @Column() followerId!: string; // quem segue
   @ManyToOne(() => User, { onDelete: 'CASCADE' })
   @JoinColumn({ name: 'followerId' })
   follower!: User;

   @Column() followingId!: string; // quem é seguido
   @ManyToOne(() => User, { onDelete: 'CASCADE' })
   @JoinColumn({ name: 'followingId' })
   following!: User;
}
