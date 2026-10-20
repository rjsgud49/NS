import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { GeneratorController } from './generator.controller';
import { validateProjectConfig } from './validate-config';
import { sampleConfig, sampleEntity } from './testing/fixtures';

describe('validateProjectConfig', () => {
  it('accepts the wizard default and returns it unchanged', () => {
    const config = sampleConfig({
      entities: [
        sampleEntity({
          name: 'User',
          relations: [{ type: 'one-to-many', target: 'Post', fieldName: 'posts' }],
        }),
        sampleEntity({ name: 'Post' }),
      ],
    });

    assert.equal(validateProjectConfig(config), config);
  });

  it('rejects a missing body, a bad port, and a reserved field name', () => {
    assert.throws(() => validateProjectConfig(undefined), BadRequestException);
    assert.throws(() => validateProjectConfig(sampleConfig({ port: 0 })), (error: BadRequestException) => {
      assert.match(String(error.message), /port/);
      return true;
    });
    assert.throws(
      () => validateProjectConfig(sampleConfig({
        entities: [sampleEntity({
          fields: [{ name: 'id', type: 'number', isUnique: false, isOptional: false, isArray: false }],
        })],
      })),
      (error: BadRequestException) => {
        assert.match(String(error.message), /id/);
        return true;
      },
    );
  });

  it('rejects relation targets that are not part of the project', () => {
    assert.throws(
      () => validateProjectConfig(sampleConfig({
        entities: [sampleEntity({
          relations: [{ type: 'many-to-one', target: 'User', fieldName: 'author' }],
        })],
      })),
      /target/,
    );
  });

  it('is applied by the preview endpoint before generation', () => {
    let called = false;
    const controller = new GeneratorController({
      getFileTree: () => {
        called = true;
        return { files: [] };
      },
      generateZip: async () => Buffer.alloc(0),
    } as never);

    assert.throws(() => controller.preview({ config: undefined } as never), BadRequestException);
    assert.equal(called, false);
    assert.deepEqual(controller.preview({ config: sampleConfig() }), { files: [] });
    assert.equal(called, true);
  });
});
