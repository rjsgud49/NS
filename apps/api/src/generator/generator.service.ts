import { Injectable } from '@nestjs/common';
import { ProjectConfig } from '@ns/shared';
import { FileTreeService } from './services/file-tree.service';
import { ZipService } from './services/zip.service';

@Injectable()
export class GeneratorService {
  constructor(
    private readonly fileTree: FileTreeService,
    private readonly zip: ZipService,
  ) {}

  getFileTree(config: ProjectConfig) {
    return { files: this.fileTree.build(config) };
  }

  async generateZip(config: ProjectConfig): Promise<Buffer> {
    const files = this.fileTree.build(config);
    return this.zip.pack(files);
  }
}
