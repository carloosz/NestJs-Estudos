import {
   Controller,
   Get,
   Post,
   Body,
   Patch,
   Delete,
   Param,
   Res,
} from '@nestjs/common';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IsUUIDParam } from '../../common/decorators/is-uuidparam.decorator';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

@ApiTags('users')
@Controller('users')
export class UserController {
   constructor(private readonly userService: UserService) {}

   @ApiOperation({ summary: 'Create user' })
   @ApiOkResponse({ description: 'User created successfully' })
   @Post()
   create(@Body() createUserDto: CreateUserDto) {
      return this.userService.create(createUserDto);
   }

   @ApiOperation({ summary: 'Find all users' })
   @Get()
   findAll() {
      return this.userService.findAll();
   }

   @Get('confirm-email/:token')
   async confirmEmail(@Param('token') token: string, @Res() res: Response) {
      const html = await this.userService.confirmEmailPage(token);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
   }

   @ApiOperation({ summary: 'Find one user' })
   @Get(':id')
   async findOne(@IsUUIDParam('id') id: string) {
      return await this.userService.findOne(id);
   }

   @ApiOperation({ summary: 'Update user' })
   @Patch(':id')
   update(@IsUUIDParam('id') id: string, @Body() updateUserDto: UpdateUserDto) {
      return this.userService.update(id, updateUserDto);
   }

   @ApiOperation({ summary: 'Delete user' })
   @Delete(':id')
   remove(@IsUUIDParam('id') id: string) {
      return this.userService.remove(id);
   }
}
