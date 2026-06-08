import { Module } from '@nestjs/common';
import { GeneratorController } from './generator.controller';
import { GeneratorService } from './generator.service';
import { FileTreeService } from './services/file-tree.service';
import { ZipService } from './services/zip.service';

@Module({
  controllers: [GeneratorController],
  providers: [GeneratorService, FileTreeService, ZipService],
})
export class GeneratorModule {}
