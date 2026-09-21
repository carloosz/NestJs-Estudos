import {
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CommonEntityInterface } from '../common/interfaces/common-entity.interface';

export abstract class CommonEntity implements CommonEntityInterface {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty({ description: 'Unique identifier for the entity' })
    id!: string;

    @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    @ApiProperty({ description: 'Timestamp when the entity was created' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    @ApiProperty({ description: 'Timestamp when the entity was last updated' })
    updatedAt!: Date;
}
