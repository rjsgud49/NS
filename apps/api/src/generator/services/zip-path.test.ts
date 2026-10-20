import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { FileTreeService } from './file-tree.service';
import { ZipService } from './zip.service';
import { sanitizeDownloadName, sanitizeZipPath } from './zip-path';
import { sampleConfig, sampleEntity } from '../testing/fixtures';

describe('zip paths and download names', () => {
  it('rejects entries that escape the archive', () => {
    for (const filePath of ['../evil.ts', '/etc/passwd', 'foo/../../etc/passwd', '..\\evil.ts', 'bad\0.ts', '']) {
      assert.throws(() => sanitizeZipPath(filePath), BadRequestException);
    }
    assert.equal(sanitizeZipPath('a\\..\\b.ts'), 'b.ts');
  });

  it('keeps normal generated paths and collapses safe relative segments', () => {
    assert.equal(sanitizeZipPath('src/app.module.ts'), 'src/app.module.ts');
    assert.equal(sanitizeZipPath('src/../package.json'), 'package.json');
    assert.equal(sanitizeZipPath('src\\main.ts'), 'src/main.ts');
  });

  it('strips header injection characters from the download filename', () => {
    assert.equal(sanitizeDownloadName('my-nest-app'), 'my-nest-app.zip');
    assert.equal(sanitizeDownloadName('my-nest-app.zip'), 'my-nest-app.zip');
    assert.equal(sanitizeDownloadName('bad"\r\nname'), 'badname.zip');
    assert.equal(sanitizeDownloadName('../../etc/passwd'), 'etc-passwd.zip');
    assert.equal(sanitizeDownloadName(undefined), 'project.zip');
    assert.equal(sanitizeDownloadName(''), 'project.zip');
  });

  it('packs a project whose entity name contains parent segments without leaving the archive', async () => {
    const files = new FileTreeService().build(
      sampleConfig({
        auth: 'none',
        entities: [sampleEntity({ name: 'Outside' })],
      }),
    );
    files.push({ path: 'src/../../outside.txt', content: 'nope' });

    const zip = await new ZipService().pack(files.filter((file) => file.path !== 'src/../../outside.txt'));
    assert.equal(zip.subarray(0, 2).toString(), 'PK');
    await assert.rejects(
      () => new ZipService().pack([{ path: '../outside.txt', content: 'nope' }]),
      BadRequestException,
    );

    for (const file of files.filter((entry) => entry.path !== 'src/../../outside.txt')) {
      const safe = sanitizeZipPath(file.path);
      assert.equal(safe.split('/').includes('..'), false);
    }
  });
});
