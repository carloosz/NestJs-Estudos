import { MulterModule } from '@nestjs/platform-express';
import { Module } from '@nestjs/common';
import { diskStorage } from 'multer';
import { UPLOAD_PATH } from 'src/common/constants';
import { editFileName } from '../../common/utils/file-utils';
import { UploadController } from './upload.controller';
import { Upload } from './entities/upload.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadService } from './upload.service';

@Module({
   imports: [
      TypeOrmModule.forFeature([Upload]),
      MulterModule.register({
         storage: diskStorage({
            destination: UPLOAD_PATH,
            filename: editFileName,
         }),
      }),
   ],
   controllers: [UploadController],
   providers: [UploadService],
   exports: [UploadService],
})
export class UploadModule {}
