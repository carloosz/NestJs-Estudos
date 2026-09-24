import { Injectable } from '@nestjs/common';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TemplateService {
   private cache = new Map<string, HandlebarsTemplateDelegate>();

   render(templateName: string, context: Record<string, any>): string {
      const compiled = this.getCompiledTemplate(templateName);
      return compiled(context);
   }

   private getCompiledTemplate(templateName: string) {
      if (this.cache.has(templateName)) {
         return this.cache.get(templateName)!;
      }

      const filePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
      const source = fs.readFileSync(filePath, 'utf-8');
      const compiled = handlebars.compile(source);
      this.cache.set(templateName, compiled);
      return compiled;
   }
}
