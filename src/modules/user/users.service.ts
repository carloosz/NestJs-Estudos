import {
   BadRequestException,
   Injectable,
   NotFoundException,
   InternalServerErrorException
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository, In } from 'typeorm';
import { UserDto } from './dto/user.dto';
import { plainToInstance } from 'class-transformer';
import { Role } from 'src/modules/role/entities/role.entity';
import { UserRole } from 'src/modules/user-role/entities/user-role.entity';
import { CryptUtil } from 'src/common/utils/crypt.util';
import { LoggerService } from 'src/modules/logger/logger.service';
import { EmailService } from 'src/modules/email/email.service';
import { TemplateService } from 'src/modules/email/template.service';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { MoreThanOrEqual, Not } from 'typeorm';

@Injectable()
export class UserService {
   constructor(
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
      @InjectRepository(Role)
      private readonly roleRepository: Repository<Role>,
      @InjectRepository(UserRole)
      private readonly userRoleRepository: Repository<UserRole>,
      private loggerService: LoggerService,
      private readonly emailService: EmailService,
      private readonly templateService: TemplateService,
      private readonly jwtService: JwtService,
   ) {
      this.loggerService.setContext(UserService.name);
   }

   public async create(createUserDto: CreateUserDto): Promise<UserDto> {
      const email = createUserDto.email.toLowerCase();

      const emailExists = await this.userRepository.findOne({
         where: { email },
      });
      if (emailExists) {
         throw new BadRequestException('Erro: Dados já cadastrados!');
      }

      const base = createUserDto.name.replace(/\s+/g, '').toLowerCase();
      let nickname: string;
      let exists = true;

      do {
         nickname = `${base}_${Math.floor(Math.random() * 100000)}`;
         exists = !!(await this.userRepository.findOne({
            where: { nickname },
         }));
      } while (exists);

      const defaultRole = 'authenticated';

      const role = await this.roleRepository.findOneBy({ name: defaultRole });
      if (!role) {
         throw new NotFoundException(`Role ${defaultRole} not found`);
      }

      const userRole = await this.userRoleRepository.create({
         role,
      });

      const user = this.userRepository.create({
         ...createUserDto,
         nickname,
         email: createUserDto.email.toLowerCase(),
         userRoles: [userRole],
      });

      const savedUser = await this.userRepository.save(user);

      const token = this.jwtService.sign(
         { sub: savedUser.id, purpose: 'email-confirmation' },
         { expiresIn: '1d' },
      );

      const confirmUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/users/confirm-email/${token}`;

      try {
         await this.emailService.send({
            to: user.email,
            subject: 'Confirme seu email',
            template: 'confirm-email',
            context: {
               name: savedUser.name,
               confirmUrl: confirmUrl,
            },
         });
      } catch (e) {
         // já logado dentro do EmailService — cadastro segue normal
      }

      return plainToInstance(UserDto, { ...savedUser, roles: [role] });
   }

   public async findAll(): Promise<UserDto[]> {
      this.loggerService.log('Inside findAll');
      const users = await this.userRepository.find({
         relations: {
            userRoles: {
               role: true,
            },
         },
      });

      const formattedUsers = users.map((user) => {
         const roles: Role[] = user.userRoles.map((userRole) => userRole.role);
         return plainToInstance(UserDto, { ...user, roles });
      });

      return formattedUsers;
   }

   public async findOne(id: string): Promise<UserDto> {
      const user = await this.userRepository.findOne({
         where: { id },
         relations: {
            userRoles: {
               role: true,
            },
            uploads: true,
         },
      });

      if (!user) {
         console.log('Usuário com id ' + id + ' nao encontrado');
         throw new NotFoundException(`Usuário não encontrado`);
      }
      return plainToInstance(UserDto, {
         ...user,
         roles: user.userRoles.map((userRole) => userRole.role),
      });
   }

   public async update(
      id: string,
      updateUserDto: UpdateUserDto,
   ): Promise<UserDto> {
      const duplicatedNickname = await this.userRepository.findOne({
         where: {
            nickname: updateUserDto.nickname,
            id: Not(id),
         },
      })

      if (duplicatedNickname) {
         throw new BadRequestException('Nickname não disponível');
      }

      await this.userRepository.update({ id }, updateUserDto);
      return await this.findOne(id);
   }

   public async remove(id: string) {
      return await this.userRepository.delete({ id });
   }

   async validateUserPassword(
      email: string,
      password: string,
   ): Promise<UserDto | null> {
      const user = await this.userRepository.findOne({
         where: [{ email }, { nickname: email }],
         relations: {
            userRoles: {
               role: true,
            },
         },
      });

      if (
         user &&
         (await CryptUtil.validatePassword(password, user.password, user.salt))
      ) {
         return plainToInstance(UserDto, user);
      }

      return null;
   }

   async confirmEmailPage(token: string): Promise<string> {
      const loginUrl = `${process.env.FRONTEND_URL}/login`;

      try {
         const payload = this.jwtService.verify(token);

         if (payload.purpose !== 'email-confirmation') {
            throw new Error('Token inválido');
         }

         const user = await this.userRepository.findOneBy({ id: payload.sub });
         if (!user) {
            throw new Error('Usuário não encontrado');
         }

         if (!user.confirmed) {
            user.confirmed = true;
            await this.userRepository.save(user);
         }

         return this.templateService.render('confirm-success', { loginUrl });
      } catch (e: any) {
         const message =
            e.name === 'TokenExpiredError'
               ? 'Esse link expirou. Peça um novo email de confirmação.'
               : 'Esse link de confirmação é inválido.';

         return this.templateService.render('confirm-error', {
            loginUrl,
            message,
         });
      }
   }

   /**
    * Generate a new token for resetToken and
    * add expiration Token date
    *
    * @param email email to try to find the user
    * @param ttlMinutes times in minutes of how long token will be expired
    * @return Promise<User>
    */
   async updateResetTokenByEmail(
      email: string,
      ttlMinutes: number,
   ): Promise<User | undefined> {
      // try to find the user by email
      const user = await this.userRepository.findOne({ where: { email } });

      if (user) {
         return this.updateResetToken(user, ttlMinutes);
      } else {
         return;
      }
   }

   /**
    * Generate a new reset token and save it on user with its expiration date
    *
    * @return User with new info
    * @param user
    * @param ttlMinutes
    */
   private async updateResetToken(
      user: User,
      ttlMinutes: number,
   ): Promise<User | undefined> {
      // current date
      const now = new Date();

      // new user token is a random uuid
      user.resetToken = randomUUID();

      // set the token expiration date
      user.resetTokenExp = new Date(now.getTime() + ttlMinutes * 60 * 1000);

      // call repo to persist it
      return this.userRepository.save(user);
   }

   /**
    * Update password if resetToken is valid
    *
    * @param resetToken rest Token that was sent to the email
    * @return Promise<User | null>
    */
   async updatePassword(
      resetToken: string,
      password: string,
   ): Promise<User | null> {
      // lookup user by reset token and get user with token not expired
      const user = await this.userRepository.findOne({
         where: {
            resetToken,
            resetTokenExp: MoreThanOrEqual<Date>(new Date()),
         },
      });

      // got a user?
      if (user) {
         // yes, set the new password and overwrite token and exp
         user.password = password;
         user.resetToken = null;
         user.resetTokenExp = null;
         // try to save it
         try {
            return this.userRepository.save(user);
         } catch (error) {
            throw new InternalServerErrorException(
               'Updating user password failed.',
            );
         }
      } else {
         throw new NotFoundException('Invalid token');
      }
   }
}
