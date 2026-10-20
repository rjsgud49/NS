import 'reflect-metadata';
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp, WEB_ORIGINS } from './main';

describe('local web CORS', () => {
  let base = '';
  let close = async () => {};

  before(async () => {
    const app = await NestFactory.create(AppModule, { logger: false });
    configureApp(app);
    await app.listen(0);
    const address = app.getHttpServer().address();
    const port = typeof address === 'object' && address ? address.port : 0;
    base = `http://127.0.0.1:${port}`;
    close = () => app.close();
  });

  after(async () => {
    await close();
  });

  it('allows both localhost and loopback origins used by the wizard', async () => {
    assert.deepEqual(WEB_ORIGINS, ['http://localhost:3000', 'http://127.0.0.1:3000']);
    for (const origin of WEB_ORIGINS) {
      const response = await fetch(`${base}/api/generate/preview`, {
        method: 'OPTIONS',
        headers: {
          Origin: origin,
          'Access-Control-Request-Method': 'POST',
        },
      });
      assert.equal(response.headers.get('access-control-allow-origin'), origin);
    }

    const blocked = await fetch(`${base}/api/generate/preview`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://evil.example',
        'Access-Control-Request-Method': 'POST',
      },
    });
    assert.notEqual(blocked.headers.get('access-control-allow-origin'), 'http://evil.example');
  });
});
