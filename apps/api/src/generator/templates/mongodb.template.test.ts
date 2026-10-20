import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderEnv } from './env.template';
import { renderPackageJson } from './package-json.template';
import { renderPrismaSchema } from './prisma.template';
import { renderTypeOrmConfig } from './typeorm.template';
import { syntaxErrors } from '../testing/syntax';
import { sampleConfig, sampleEntity } from '../testing/fixtures';

const post = sampleEntity({
  name: 'Post',
  relations: [{ type: 'many-to-one', target: 'User', fieldName: 'author' }],
});
const user = sampleEntity({ name: 'User', fields: [], relations: [] });

describe('mongodb generation', () => {
  it('points TypeORM at DATABASE_URL and does not default the port to Postgres', () => {
    const config = sampleConfig({ database: 'mongodb', orm: 'typeorm', auth: 'none' });
    const env = renderEnv(config);
    const typeorm = renderTypeOrmConfig(config);
    const pkg = JSON.parse(renderPackageJson(config));

    assert.match(env, /DATABASE_URL="mongodb:\/\/localhost:27017\/my-nest-app"/);
    assert.doesNotMatch(env, /DB_PORT/);
    assert.match(typeorm, /url: process\.env\.DATABASE_URL/);
    assert.doesNotMatch(typeorm, /5432/);
    assert.equal(syntaxErrors(typeorm).length, 0, syntaxErrors(typeorm).join('\n'));
    assert.equal(pkg.dependencies.mongodb, '^6.8.0');
    assert.equal(pkg.dependencies.pg, undefined);
  });

  it('uses ObjectId ids in the Prisma schema', () => {
    const schema = renderPrismaSchema(sampleConfig({
      database: 'mongodb',
      orm: 'prisma',
      auth: 'none',
      entities: [user, post],
    }));

    assert.match(schema, /id\s+String\s+@id @default\(auto\(\)\) @map\("_id"\) @db\.ObjectId/);
    assert.match(schema, /authorId\s+String\s+@db\.ObjectId/);
    assert.doesNotMatch(schema, /autoincrement/);
  });

  it('keeps integer ids for Postgres', () => {
    const schema = renderPrismaSchema(sampleConfig({
      database: 'postgres',
      orm: 'prisma',
      entities: [post],
    }));
    assert.match(schema, /id\s+Int\s+@id @default\(autoincrement\(\)\)/);
    assert.match(schema, /authorId\s+Int/);
  });
});
