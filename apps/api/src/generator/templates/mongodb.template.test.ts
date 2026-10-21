import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderController, renderEntity, renderService } from './crud.template';
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

  it('addresses MongoDB documents by ObjectId instead of parsing the id as an integer', () => {
    const entity = sampleEntity({
      fields: [
        { name: 'title', type: 'string', isUnique: true, isOptional: false, isArray: false },
        { name: 'note', type: 'text', isUnique: false, isOptional: true, isArray: false },
      ],
    });
    const typeorm = sampleConfig({ database: 'mongodb', orm: 'typeorm', auth: 'none', entities: [entity] });
    const prisma = sampleConfig({ database: 'mongodb', orm: 'prisma', auth: 'none', entities: [entity] });
    const typeormEntity = renderEntity(entity, typeorm);
    const typeormService = renderService(entity, typeorm);
    const typeormController = renderController(entity, typeorm);
    const prismaService = renderService(entity, prisma);
    const prismaController = renderController(entity, prisma);

    assert.match(typeormEntity, /@ObjectIdColumn\(\)\s+id: ObjectId;/);
    assert.doesNotMatch(typeormEntity, /PrimaryGeneratedColumn|type: 'varchar'/);
    assert.match(typeormEntity, /@Column\(\{ unique: true \}\)/);
    assert.match(typeormEntity, /@Column\(\{ nullable: true \}\)/);
    assert.match(typeormService, /ObjectId\.isValid\(id\)/);
    assert.match(typeormService, /where: \{ _id: this\.objectId\(id\) \} as any/);
    assert.match(typeormService, /this\.repo\.update\(this\.objectId\(id\)/);
    assert.doesNotMatch(typeormController, /ParseIntPipe/);
    assert.match(typeormController, /@Param\('id'\) id: string/);
    assert.match(prismaService, /findOne\(id: string\)/);
    assert.match(prismaController, /@Param\('id'\) id: string/);
    assert.equal(syntaxErrors(typeormEntity).length, 0, syntaxErrors(typeormEntity).join('\n'));
    assert.equal(syntaxErrors(typeormService).length, 0, syntaxErrors(typeormService).join('\n'));
    assert.equal(syntaxErrors(typeormController).length, 0, syntaxErrors(typeormController).join('\n'));
    assert.equal(syntaxErrors(prismaService).length, 0);
    assert.equal(syntaxErrors(prismaController).length, 0);
  });

  it('keeps integer ids for Postgres', () => {
    const schema = renderPrismaSchema(sampleConfig({
      database: 'postgres',
      orm: 'prisma',
      entities: [post],
    }));
    assert.match(schema, /id\s+Int\s+@id @default\(autoincrement\(\)\)/);
    assert.match(schema, /authorId\s+Int/);

    const entity = sampleEntity();
    const config = sampleConfig({ entities: [entity] });
    assert.match(renderEntity(entity, config), /@PrimaryGeneratedColumn\(\)\s+id: number;/);
    assert.match(renderService(entity, config), /findOne\(id: number\)/);
    assert.match(renderController(entity, config), /ParseIntPipe/);
  });
});
