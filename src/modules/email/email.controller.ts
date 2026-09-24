import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EmailService } from './email.service';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}
}
