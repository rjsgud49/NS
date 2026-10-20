import { Injectable } from '@nestjs/common';
import { createRequire } from 'node:module';
import { GeneratedFile } from '../types';
import { Writable } from 'stream';
import { sanitizeZipPath } from './zip-path';

const archiver = createRequire(__filename)('archiver') as typeof import('archiver');

@Injectable()
export class ZipService {
  pack(files: GeneratedFile[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      let safeFiles: GeneratedFile[];
      try {
        safeFiles = files.map((file) => ({
          path: sanitizeZipPath(file.path),
          content: file.content,
        }));
      } catch (error) {
        reject(error);
        return;
      }

      let settled = false;
      const fail = (error: unknown) => {
        if (settled) return;
        settled = true;
        reject(error);
      };
      const succeed = (buffer: Buffer) => {
        if (settled) return;
        settled = true;
        resolve(buffer);
      };

      const chunks: Buffer[] = [];
      const writable = new Writable({
        write(chunk, _enc, cb) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          cb();
        },
      });

      writable.on('finish', () => succeed(Buffer.concat(chunks)));
      writable.on('error', fail);

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('error', fail);
      archive.pipe(writable);

      for (const file of safeFiles) {
        archive.append(file.content, { name: file.path });
      }

      archive.finalize();
    });
  }
}
