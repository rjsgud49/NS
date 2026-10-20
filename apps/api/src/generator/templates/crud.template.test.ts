import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderService } from './crud.template';
import { sampleConfig, sampleEntity } from '../testing/fixtures';
import { syntaxErrors } from '../testing/syntax';

const userRelation = {
  type: 'many-to-one' as const,
  target: 'User',
  fieldName: 'author',
};

describe('renderService relations', () => {
  it('emits a single options object for TypeORM findOne', () => {
    const source = renderService(
      sampleEntity({ relations: [userRelation] }),
      sampleConfig(),
    );

    assert.equal(syntaxErrors(source).length, 0, syntaxErrors(source).join('\n'));
    assert.match(source, /findAll\(\) \{\s*return this\.repo\.find\(\{ relations: \["author"\] \}\);/);
    assert.match(
      source,
      /findOne\(\{ where: \{ id \}, relations: \["author"\] \}\)/,
    );
    assert.doesNotMatch(source, /\}, \{ relations:/);
  });

  it('emits a single options object for Prisma findUnique', () => {
    const source = renderService(
      sampleEntity({ relations: [userRelation] }),
      sampleConfig({ orm: 'prisma' }),
    );

    assert.equal(syntaxErrors(source).length, 0, syntaxErrors(source).join('\n'));
    assert.match(source, /findMany\(\{ include: \{ "author": true \} \}\)/);
    assert.match(
      source,
      /findUnique\(\{ where: \{ id \}, include: \{ "author": true \} \}\)/,
    );
    assert.doesNotMatch(source, /\}, \{ include:/);
  });

  it('omits relation options when the entity has none', () => {
    const typeorm = renderService(sampleEntity(), sampleConfig());
    const prisma = renderService(sampleEntity(), sampleConfig({ orm: 'prisma' }));

    assert.equal(syntaxErrors(typeorm).length, 0);
    assert.equal(syntaxErrors(prisma).length, 0);
    assert.match(typeorm, /this\.repo\.find\(\);/);
    assert.match(typeorm, /findOne\(\{ where: \{ id \} \}\)/);
    assert.match(prisma, /findMany\(\);/);
    assert.match(prisma, /findUnique\(\{ where: \{ id \} \}\)/);
  });

  it('keeps relation field names with quotes syntactically valid', () => {
    const source = renderService(
      sampleEntity({ relations: [{ ...userRelation, fieldName: 'auth"or' }] }),
      sampleConfig(),
    );

    assert.equal(syntaxErrors(source).length, 0, syntaxErrors(source).join('\n'));
    assert.match(source, /relations: \["auth\\"or"\]/);
  });
});
