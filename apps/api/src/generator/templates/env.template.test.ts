import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FileTreeService } from '../services/file-tree.service';
import { createEnvSecrets, renderEnv } from './env.template';
import { sampleConfig } from '../testing/fixtures';

describe('renderEnv', () => {
  it('reuses the same JWT secret for a single project and keeps it out of the example file', () => {
    const secrets = createEnvSecrets();
    const config = sampleConfig({ auth: 'jwt-refresh' });
    const env = renderEnv(config, { secrets });
    const again = renderEnv(config, { secrets });
    const example = renderEnv(config, { example: true });

    assert.equal(env, again);
    assert.match(env, new RegExp(`JWT_SECRET="${secrets.jwt}"`));
    assert.match(env, new RegExp(`JWT_REFRESH_SECRET="${secrets.refresh}"`));
    assert.match(example, /JWT_SECRET="change-me"/);
    assert.match(example, /JWT_REFRESH_SECRET="change-me-refresh"/);
    assert.doesNotMatch(example, new RegExp(secrets.jwt));
    assert.doesNotMatch(example, new RegExp(secrets.refresh));
  });

  it('encodes the project name inside DATABASE_URL and quotes unsafe values', () => {
    const env = renderEnv(sampleConfig({ name: 'my app"\n', auth: 'none' }));

    assert.match(env, /DATABASE_URL="postgresql:\/\/user:password@localhost:5432\/my%20app%22%0A"/);
    assert.match(env, /DB_NAME="my app\\"\\n"/);
  });

  it('writes one secret pair into both generated env files', () => {
    const files = new FileTreeService().build(sampleConfig({ auth: 'jwt' }));
    const env = files.find((file) => file.path === '.env')?.content ?? '';
    const example = files.find((file) => file.path === '.env.example')?.content ?? '';
    const secret = env.match(/JWT_SECRET="([^"]+)"/)?.[1];

    assert.ok(secret);
    assert.notEqual(secret, 'change-me');
    assert.match(example, /JWT_SECRET="change-me"/);
    assert.doesNotMatch(example, new RegExp(secret!));
  });
});
