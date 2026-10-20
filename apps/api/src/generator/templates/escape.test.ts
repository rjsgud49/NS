import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderMain } from './main.template';
import { renderConfigFiles } from './config.template';
import { renderTypeOrmConfig } from './typeorm.template';
import { syntaxErrors } from '../testing/syntax';
import { sampleConfig } from '../testing/fixtures';

describe('generated string literals', () => {
  it('keeps quotes and newlines inside Swagger and database defaults', () => {
    const config = sampleConfig({
      name: "o'hara",
      description: "line1\nline2'end",
      auth: 'none',
      features: { swagger: true },
    });
    const main = renderMain(config);
    const configuration = renderConfigFiles(config).find((file) => file.path.endsWith('configuration.ts'))?.content ?? '';
    const validation = renderConfigFiles(config).find((file) => file.path.endsWith('env.validation.ts'))?.content ?? '';
    const typeorm = renderTypeOrmConfig(config);

    for (const source of [main, configuration, validation, typeorm]) {
      assert.equal(syntaxErrors(source).length, 0, syntaxErrors(source).join('\n'));
    }
    assert.match(main, /setTitle\('o\\'hara API'\)/);
    assert.match(main, /setDescription\('line1\\nline2\\'end'\)/);
    assert.doesNotMatch(main, /setDescription\('line1\n/);
  });
});
