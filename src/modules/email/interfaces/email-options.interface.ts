export interface EmailOptions {
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  subject: string;
  text?: string;
  html?: string;
}

export type SendEmailOptions = Omit<EmailOptions, 'html' | 'from'> & {
  from?: string;
  template: string;
  context?: Record<string, any>;
};
