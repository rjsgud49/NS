import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderAppModule } from './app-module.template';
import { syntaxErrors } from '../testing/syntax';
import { sampleConfig } from '../testing/fixtures';

describe('renderAppModule rate limit', () => {
  it('registers ThrottlerGuard globally only when rate limiting is enabled', () => {
    const enabled = renderAppModule(sampleConfig({ features: { rateLimit: true } }));
    const disabled = renderAppModule(sampleConfig({ features: { rateLimit: false } }));

    assert.equal(syntaxErrors(enabled).length, 0, syntaxErrors(enabled).join('\n'));
    assert.match(enabled, /ThrottlerGuard/);
    assert.match(enabled, /provide: APP_GUARD, useClass: ThrottlerGuard/);
    assert.doesNotMatch(disabled, /ThrottlerGuard/);
    assert.doesNotMatch(disabled, /providers:/);
  });
});
