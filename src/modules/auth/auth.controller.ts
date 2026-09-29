import {
   Controller,
   Post,
   HttpCode,
   UseGuards,
   Body,
   Param,
   Patch,
} from '@nestjs/common';
import { AuthUser } from './decorator/auth-user.decorator';
import { UserDto } from 'src/modules/user/dto/user.dto';
import { LocalAuthGuard } from './guards/local-auth-guard';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AuthEmailDto } from './dto/auth-email.dto';
import { AuthUpdatePasswordDto } from './dto/auth-update-password.dto';

@Controller('auth')
export class AuthController {
   constructor(private authService: AuthService) {}

   @UseGuards(LocalAuthGuard)
   @Post('login')
   @HttpCode(200)
   signIn(@AuthUser() user: UserDto) {
      return this.authService.signIn(user);
   }

   @Post('refresh')
   @ApiOperation({ summary: 'Refresh access token' })
   async refresh(@Body() dto: RefreshTokenDto) {
      return this.authService.refresh(dto.refreshToken);
   }

   @Post('forgot-password')
   @HttpCode(200)
   @ApiOperation({
      description:
         'Generate a reset token and send an email to the user, if the email exists',
   })
   @ApiResponse({
      status: 200,
      description:
         'Success is returned even if the email does not exist for security reasons',
   })
   async forgotPassword(@Body() authEmailDto: AuthEmailDto): Promise<void> {
      return this.authService.forgotPassword(authEmailDto.email);
   }

   @Patch(':resetToken/reset-password')
   @ApiOperation({
      description: 'If resetToken exists and is still valid, update password.',
      operationId: 'auth_resetUpdatePassword',
   })
   @ApiParam({
      name: 'resetToken',
      description: 'The reset token',
      schema: { type: 'string', format: 'uuid' },
   })
   @ApiResponse({
      status: 200,
      description: 'Password was changed successfully',
   })
   @ApiResponse({ status: 400, description: 'Bad request.' })
   @ApiResponse({
      status: 404,
      description: 'Token does not exist or has expired.',
   })
   async resetPassword(
      @Param('resetToken') resetToken: string,
      @Body() authUpdatePasswordDto: AuthUpdatePasswordDto,
   ) {
      return this.authService.updatePassword(resetToken, authUpdatePasswordDto);
   }
}
