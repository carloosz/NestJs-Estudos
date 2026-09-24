import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Upload } from './entities/upload.entity';
import { User } from '../user/entities/user.entity';
import { UploadType } from './enum/upload-type.enum';
import * as path from 'path';
import * as fs from 'fs';

const MAX_PHOTOS_PER_TYPE = 5;

@Injectable()
export class UploadService {
   constructor(
      @InjectRepository(Upload)
      private readonly uploadRepository: Repository<Upload>,
   ) {}

   async uploadPhoto(
      userId: string,
      type: UploadType,
      file: Express.Multer.File,
   ): Promise<Upload> {
      // desativa a foto atual desse tipo
      await this.uploadRepository.update(
         { user: { id: userId }, type, active: true },
         { active: false },
      );

      // cria a nova como ativa
      const upload = this.uploadRepository.create({
         filename: file.filename,
         mimetype: file.mimetype,
         type,
         active: true,
         user: { id: userId } as User,
      });
      await this.uploadRepository.save(upload);

      await this.enforceMaxPhotos(userId, type);

      return upload;
   }

   private async enforceMaxPhotos(userId: string, type: UploadType) {
      const photos = await this.uploadRepository.find({
         where: { user: { id: userId }, type },
         order: { createdAt: 'DESC' },
      });

      const excess = photos.slice(MAX_PHOTOS_PER_TYPE);

      for (const photo of excess) {
         await this.deleteFileFromDisk(photo.filename);
         await this.uploadRepository.delete(photo.id);
      }
   }

   private async deleteFileFromDisk(filename: string) {
      const filePath = path.join(process.cwd(), 'files', filename);
      await fs.promises.unlink(filePath).catch(() => {});
   }
}
