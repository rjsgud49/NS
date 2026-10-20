import { BadRequestException } from '@nestjs/common';
import * as path from 'path';

export function sanitizeZipPath(filePath: string): string {
  if (typeof filePath !== 'string' || filePath.length === 0 || filePath.includes('\0')) {
    throw new BadRequestException('잘못된 파일 경로입니다.');
  }

  const normalized = path.posix.normalize(filePath.replace(/\\/g, '/'));
  const parts = normalized.split('/');
  if (path.posix.isAbsolute(normalized) || normalized === '..' || parts.includes('..')) {
    throw new BadRequestException(`허용되지 않는 파일 경로입니다: ${filePath}`);
  }

  return normalized.replace(/^\.\//, '');
}

export function sanitizeDownloadName(name: string | undefined): string {
  const cleaned = (name ?? '')
    .replace(/[\r\n"]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/\.{2,}/g, '')
    .replace(/^-+|-+$/g, '')
    .replace(/^\.+/, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const base = cleaned || 'project';
  return base.toLowerCase().endsWith('.zip') ? base : `${base}.zip`;
}
