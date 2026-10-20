import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderAuthModule } from './auth.template';
import { syntaxErrors } from '../testing/syntax';
import { sampleConfig } from '../testing/fixtures';

function content(auth: 'jwt' | 'jwt-refresh-roles', path: string) {
  const file = renderAuthModule(sampleConfig({ auth })).find((entry) => entry.path === path);
  assert.ok(file, path);
  assert.equal(syntaxErrors(file.content).length, 0, syntaxErrors(file.content).join('\n'));
  return file.content;
}

describe('role-aware auth generation', () => {
  it('puts roles on the example token and the JWT user when RBAC is selected', () => {
    const service = content('jwt-refresh-roles', 'src/auth/auth.service.ts');
    const access = content('jwt-refresh-roles', 'src/auth/strategies/jwt.strategy.ts');
    const refresh = content('jwt-refresh-roles', 'src/auth/strategies/jwt-refresh.strategy.ts');

    assert.match(service, /roles: \['user'\]/);
    assert.match(service, /roles: user\.roles/);
    assert.match(access, /roles: payload\.roles \?\? \[\]/);
    assert.match(refresh, /roles: payload\.roles \?\? \[\]/);
  });

  it('leaves plain JWT users without a roles claim', () => {
    const service = content('jwt', 'src/auth/auth.service.ts');
    const access = content('jwt', 'src/auth/strategies/jwt.strategy.ts');

    assert.doesNotMatch(service, /roles/);
    assert.doesNotMatch(access, /roles/);
  });
});
