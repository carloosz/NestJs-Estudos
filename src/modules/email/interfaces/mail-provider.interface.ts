import { EmailOptions } from './email-options.interface';

export interface MailProvider {
  send(options: EmailOptions): Promise<void>;
}
