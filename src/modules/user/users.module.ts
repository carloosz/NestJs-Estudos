import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { UserRepository } from './users.repository';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { User } from './entities/user.entity';
import { Role } from 'src/modules/role/entities/role.entity';
import { UserRole } from 'src/modules/user-role/entities/user-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserRole, Role])],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository]
})
export class UserModule {}
