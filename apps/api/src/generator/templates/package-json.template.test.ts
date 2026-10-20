import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderPackageJson } from './package-json.template';
import { renderUpdateDto } from './crud.template';
import { sampleConfig, sampleEntity } from '../testing/fixtures';

describe('renderPackageJson', () => {
  it('depends on mapped-types even when swagger is disabled', () => {
    const pkg = JSON.parse(renderPackageJson(sampleConfig({
      features: { swagger: false, validation: false, cors: false, rateLimit: false },
      entities: [sampleEntity()],
    })));
    const updateDto = renderUpdateDto(sampleEntity());

    assert.equal(pkg.dependencies['@nestjs/mapped-types'], '^2.0.5');
    assert.match(updateDto, /@nestjs\/mapped-types/);
    assert.equal(pkg.dependencies['@nestjs/swagger'], undefined);
  });
});
