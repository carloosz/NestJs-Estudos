import {
   BadRequestException,
   Injectable,
   NotFoundException,
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
      private readonly jwtService: JwtService
   ) {
      this.loggerService.setContext(UserService.name);
   }
   public async create(createUserDto: CreateUserDto): Promise<UserDto> {
      const existingUser = await this.userRepository.findOne({
         where: [
            { username: createUserDto.username },
            { email: createUserDto.email },
         ],
      });

      if (existingUser) {
         throw new BadRequestException('Erro: Dados já cadastrados!');
      }

      if (createUserDto.roles.length === 0) {
         throw new BadRequestException(
            'Erro: O usuário deve ter pelo menos uma role!',
         );
      }

      const roles = await this.roleRepository.find({
         where: { name: In(createUserDto.roles) },
      });

      if (roles.length !== createUserDto.roles.length) {
         throw new BadRequestException(
            'Erro: Uma ou mais roles informadas não existem!',
         );
      }

      const userRoles = roles.map((role) =>
         this.userRoleRepository.create({ role }),
      );

      const user = this.userRepository.create({
         ...createUserDto,
         userRoles,
      });

      const savedUser = await this.userRepository.save(user);

      const token = this.jwtService.sign(
         { sub: savedUser.id, purpose: 'email-confirmation' },
         { expiresIn: '1d' }
      );

      const confirmUrl = `${ process.env.BACKEND_URL || 'http://localhost:3000' }/users/confirm-email/${token}`;

      try {
         await this.emailService.send({
            to: user.email,
            subject: 'Confirme seu email',
            template: 'confirm-email',
            context: {
               name: savedUser.firstName,
               confirmUrl: confirmUrl
            },
         });
      } catch (e) {
         // já logado dentro do EmailService — cadastro segue normal
      }

      return plainToInstance(UserDto, { ...savedUser, roles });
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
            uploads: true
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
         where: [{ email }, { username: email }],
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
}
