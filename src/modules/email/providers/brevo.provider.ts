import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { MailProvider } from '../interfaces/mail-provider.interface';
import { EmailOptions } from '../interfaces/email-options.interface';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

interface BrevoRecipient {
   email: string;
   name?: string;
}

@Injectable()
export class BrevoProvider implements MailProvider {
   private readonly logger = new Logger(BrevoProvider.name);
   private readonly apiKey = process.env.BREVO_API_KEY;

   async send(options: EmailOptions): Promise<void> {
      const { from, to, cc, bcc, subject, text, html, replyTo } = options;

      if (!this.apiKey) {
         throw new BadRequestException('BREVO_API_KEY não configurada');
      }

      if (!from || !to) {
         throw new BadRequestException('from e to são obrigatórios');
      }

      const payload = {
         sender: this.parseAddress(from),
         to: this.toRecipients(to),
         ...(cc && { cc: this.toRecipients(cc) }),
         ...(bcc && { bcc: this.toRecipients(bcc) }),
         ...(replyTo && { replyTo: this.parseAddress(replyTo) }),
         subject,
         textContent: text,
         htmlContent: html,
      };

      try {
         await axios.post(BREVO_API_URL, payload, {
            headers: {
               'api-key': this.apiKey,
               'Content-Type': 'application/json',
            },
         });
      } catch (err: any) {
         const brevoMessage = err?.response?.data?.message;
         this.logger.error(
            `Falha ao enviar email via Brevo: ${brevoMessage ?? err.message}`,
         );
         throw new BadRequestException(brevoMessage ?? 'Erro ao enviar email');
      }
   }

   private parseAddress(address: string): BrevoRecipient {
      const match = address.match(/^(.*)<(.+)>$/);
      if (match) {
         return { name: match[1].trim() || undefined, email: match[2].trim() };
      }
      return { email: address.trim() };
   }

   private toRecipients(addresses: string | string[]): BrevoRecipient[] {
      const list = Array.isArray(addresses) ? addresses : [addresses];
      return list.map((a) => this.parseAddress(a));
   }
}
