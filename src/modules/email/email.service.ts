import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { SendEmailOptions } from './interfaces/email-options.interface';
import { TemplateService } from './template.service';
import type { MailProvider } from './interfaces/mail-provider.interface';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class EmailService {
   constructor(
      @Inject('MAIL_PROVIDER') private readonly mailProvider: MailProvider,
      private readonly templateService: TemplateService,
      private readonly loggerService: LoggerService,
   ) {}
   async send(options: SendEmailOptions) {
      const { template, context, from, ...rest } = options;

      try {
         const html = this.templateService.render(template, context ?? {});

         return await this.mailProvider.send({
            ...rest,
            from: from ?? process.env.MAIL_FROM,
            html,
         });
      } catch (e: any) {
         this.loggerService.error(
            `Falha ao enviar email (template: ${template}, to: ${rest.to}): ${e.message}`,
            EmailService.name,
         );
         throw e;
      }
   }
}
