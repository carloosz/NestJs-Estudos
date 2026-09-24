import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { TemplateService } from './template.service';
import { BrevoProvider } from './providers/brevo.provider';
///
@Module({
   imports: [],
   providers: [
         EmailService,
         TemplateService,
         { provide: 'MAIL_PROVIDER', useClass: BrevoProvider }
   ],
   controllers: [EmailController],
   exports: [EmailService, TemplateService],
})
export class EmailModule {}
