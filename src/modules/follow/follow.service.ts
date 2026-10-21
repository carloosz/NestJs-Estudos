import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';

@Injectable()
export class FollowService {
   constructor(
      @InjectRepository(Follow)
      private readonly followRepository: Repository<Follow>,
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
   ) {}

   async follow(loggedUserId: string, targetUserId: string) {
      if (loggedUserId === targetUserId) {
         throw new BadRequestException('Você não pode seguir a si mesmo');
      }

      const exists = await this.userRepository.existsBy({ id: targetUserId });
      if (!exists) throw new NotFoundException('Usuário não encontrado');

      await this.followRepository
         .createQueryBuilder()
         .insert()
         .values({
            follower: { id: loggedUserId },
            following: { id: targetUserId },
         })
         .orIgnore()
         .execute();

      return { following: true };
   }

   async unfollow (loggedUserId: string, targetUserId: string) {
      await this.followRepository.delete({
         follower: { id: loggedUserId },
         following: { id: targetUserId },
      });

      return { following: false };
   }
}
