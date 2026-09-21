import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleDto } from './dto/role.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}
  public async create(createRoleDto: CreateRoleDto) : Promise<RoleDto> {
    const existingRole = await this.roleRepository.findOne({
      where: [
        { name: createRoleDto.name },
      ],
    });

    if (existingRole) {
      throw new BadRequestException('Erro: Dados já cadastrados!');
    }
    
    const role = this.roleRepository.create(createRoleDto);
    const savedRole = await this.roleRepository.save(role);
    return plainToInstance(RoleDto, savedRole);
  }

  public async findAll() : Promise<RoleDto[]> {
    const roles = await this.roleRepository.find();
    return roles.map((role) => plainToInstance(RoleDto, role));
  }

  public async findOne(id: string) : Promise<RoleDto> {
    const role = await this.roleRepository.findOneBy({ id });
    if (!role) {
      console.log('Role com id ' + id + ' nao encontrada');
      throw new NotFoundException(`Role não encontrada`);
    }
    return plainToInstance(RoleDto, role);
  }

  public async update(id: string, updateRoleDto: UpdateRoleDto) : Promise<RoleDto> {
    await this.roleRepository.update({ id }, updateRoleDto);
    return await this.findOne(id);
  }

  public async remove(id: string) {
    return await this.roleRepository.delete({ id });
  }
}
