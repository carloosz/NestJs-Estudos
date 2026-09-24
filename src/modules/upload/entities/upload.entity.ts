import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { UploadType } from '../enum/upload-type.enum';

@Entity('uploads')
export class Upload {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  filename!: string;

  @Column()
  mimetype!: string;

  @Column({ type: 'enum', enum: UploadType })
  type!: UploadType;

  @Column({ default: false })
  active!: boolean; // true = é a foto atual em uso

  @ManyToOne(() => User, (user) => user.uploads, { onDelete: 'CASCADE' })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
