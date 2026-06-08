import { Injectable } from '@nestjs/common';
import * as archiver from 'archiver';
import { GeneratedFile } from '../types';
import { Writable } from 'stream';

@Injectable()
export class ZipService {
  pack(files: GeneratedFile[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const writable = new Writable({
        write(chunk, _enc, cb) { chunks.push(chunk); cb(); },
      });

      writable.on('finish', () => resolve(Buffer.concat(chunks)));

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('error', reject);
      archive.pipe(writable);

      for (const file of files) {
        archive.append(file.content, { name: file.path });
      }

      archive.finalize();
    });
  }
}
