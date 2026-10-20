import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FileTreeService } from '../services/file-tree.service';
import { sampleConfig, sampleEntity } from '../testing/fixtures';
import { syntaxErrors } from '../testing/syntax';

function file(configOrm: 'prisma' | 'typeorm', path: string) {
  const files = new FileTreeService().build(
    sampleConfig({
      orm: configOrm,
      entities: [sampleEntity({ name: 'Post' })],
    }),
  );
  return files.find((entry) => entry.path === path);
}

describe('prisma client files', () => {
  it('generates a Prisma module and service that parse', () => {
    const service = file('prisma', 'src/prisma/prisma.service.ts');
    const moduleFile = file('prisma', 'src/prisma/prisma.module.ts');
    const entity = file('prisma', 'src/post/entities/post.entity.ts');

    assert.ok(service);
    assert.ok(moduleFile);
    assert.equal(syntaxErrors(service.content).length, 0, syntaxErrors(service.content).join('\n'));
    assert.equal(syntaxErrors(moduleFile.content).length, 0, syntaxErrors(moduleFile.content).join('\n'));
    assert.match(service.content, /extends PrismaClient/);
    assert.match(moduleFile.content, /export class PrismaModule/);
    assert.equal(entity?.content, 'export type { Post } from \'@prisma/client\';\n');
  });

  it('does not add Prisma client files for TypeORM projects', () => {
    assert.equal(file('typeorm', 'src/prisma/prisma.service.ts'), undefined);
    const entity = file('typeorm', 'src/post/entities/post.entity.ts');
    assert.match(entity?.content ?? '', /export class Post/);
    assert.doesNotMatch(entity?.content ?? '', /@prisma\/client/);
  });
});
