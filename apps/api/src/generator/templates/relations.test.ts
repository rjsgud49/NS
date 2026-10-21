import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FileTreeService } from '../services/file-tree.service';
import { sampleConfig, sampleEntity } from '../testing/fixtures';
import { entityTypeErrors } from '../testing/syntax';
import { renderEntity } from './crud.template';
import { renderPrismaSchema } from './prisma.template';

const title = { name: 'title', type: 'string' as const, isUnique: false, isOptional: false, isArray: false };

function entitiesOf(config: Parameters<FileTreeService['build']>[0]) {
  return new FileTreeService().build(config).filter((file) => file.path.endsWith('.entity.ts'));
}

function relationNames(schema: string): string[] {
  return [...schema.matchAll(/@relation\("([^"]+)"/g)].map((match) => match[1]);
}

describe('relation inverses', () => {
  const user = sampleEntity({ name: 'User', fields: [], relations: [] });
  const postAuthor = sampleEntity({
    relations: [{ type: 'many-to-one', target: 'User', fieldName: 'author' }],
  });
  const userPosts = sampleEntity({
    name: 'User',
    fields: [],
    relations: [{ type: 'one-to-many', target: 'Post', fieldName: 'posts' }],
  });
  const postBare = sampleEntity({ fields: [], relations: [] });

  it('typechecks a TypeORM many-to-one without inventing the inverse property', () => {
    const config = sampleConfig({ entities: [user, postAuthor] });
    const post = renderEntity(postAuthor, config);
    const userEntity = renderEntity(user, config);

    assert.match(post, /@ManyToOne\(\(\) => User, \{ onDelete: 'CASCADE' \}\)/);
    assert.doesNotMatch(post, /\.posts/);
    assert.doesNotMatch(userEntity, /posts:/);
    assert.deepEqual(entityTypeErrors(entitiesOf(config)), []);
  });

  it('adds the owning TypeORM many-to-one when only one-to-many was declared', () => {
    const config = sampleConfig({ entities: [userPosts, postBare] });
    const userEntity = renderEntity(userPosts, config);
    const post = renderEntity(postBare, config);

    assert.match(userEntity, /@OneToMany\(\(\) => Post, \(post\) => post\.user\)/);
    assert.match(post, /@ManyToOne\(\(\) => User, \(user\) => user\.posts, \{ onDelete: 'CASCADE' \}\)/);
    assert.match(post, /user: User;/);
    assert.deepEqual(entityTypeErrors(entitiesOf(config)), []);
  });

  it('links both declared TypeORM sides by their real field names', () => {
    const config = sampleConfig({ entities: [userPosts, postAuthor] });
    const userEntity = renderEntity(userPosts, config);
    const post = renderEntity(postAuthor, config);

    assert.match(userEntity, /@OneToMany\(\(\) => Post, \(post\) => post\.author\)/);
    assert.match(post, /@ManyToOne\(\(\) => User, \(user\) => user\.posts, \{ onDelete: 'CASCADE' \}\)/);
    assert.doesNotMatch(userEntity, /post\.user/);
    assert.equal(entityTypeErrors(entitiesOf(config)).length, 0, entityTypeErrors(entitiesOf(config)).join('\n'));
  });

  it('keeps two TypeORM many-to-one relations as separate fields', () => {
    const post = sampleEntity({
      relations: [
        { type: 'many-to-one', target: 'User', fieldName: 'author' },
        { type: 'many-to-one', target: 'User', fieldName: 'editor' },
      ],
    });
    const config = sampleConfig({ entities: [user, post] });
    const source = renderEntity(post, config);

    assert.match(source, /author: User;/);
    assert.match(source, /editor: User;/);
    assert.doesNotMatch(source, /\.posts/);
    assert.deepEqual(entityTypeErrors(entitiesOf(config)), []);
  });

  it('adds the Prisma opposite list for a many-to-one and shares one relation name', () => {
    const schema = renderPrismaSchema(sampleConfig({
      orm: 'prisma',
      entities: [user, postAuthor],
    }));
    const names = relationNames(schema);

    assert.match(schema, /posts\s+Post\[\] @relation\("([^"]+)"\)/);
    assert.match(schema, /author\s+User @relation\("([^"]+)", fields: \[authorId\], references: \[id\]\)/);
    assert.equal(names.length, 2);
    assert.equal(names[0], names[1]);
  });

  it('adds the Prisma opposite list for many-to-many', () => {
    const schema = renderPrismaSchema(sampleConfig({
      orm: 'prisma',
      entities: [
        sampleEntity({
          relations: [{ type: 'many-to-many', target: 'Tag', fieldName: 'tags' }],
        }),
        sampleEntity({
          name: 'Tag',
          fields: [{ ...title, name: 'name' }],
          relations: [],
        }),
      ],
    }));
    const names = relationNames(schema);

    assert.match(schema, /tags\s+Tag\[\] @relation\("([^"]+)"\)/);
    assert.match(schema, /posts\s+Post\[\] @relation\("([^"]+)"\)/);
    assert.equal(new Set(names).size, 1);
  });

  it('does not add a third Prisma field when both sides already exist', () => {
    const schema = renderPrismaSchema(sampleConfig({
      orm: 'prisma',
      entities: [userPosts, postAuthor],
    }));

    assert.match(schema, /posts\s+Post\[\] @relation\("/);
    assert.match(schema, /author\s+User @relation\("/);
    assert.equal((schema.match(/Post\[\]/g) ?? []).length, 1);
    assert.equal((schema.match(/User @relation/g) ?? []).length, 1);
    assert.equal(new Set(relationNames(schema)).size, 1);
  });

  it('picks another Prisma inverse name when the default is already a field', () => {
    const schema = renderPrismaSchema(sampleConfig({
      orm: 'prisma',
      entities: [
        sampleEntity({
          name: 'User',
          fields: [{ ...title, name: 'posts' }],
          relations: [],
        }),
        postAuthor,
      ],
    }));

    assert.match(schema, /authorPosts\s+Post\[\] @relation\("/);
    assert.doesNotMatch(schema, /^\s+posts\s+Post\[\]/m);
  });

  it('gives each unpaired Prisma many-to-one its own inverse', () => {
    const schema = renderPrismaSchema(sampleConfig({
      orm: 'prisma',
      entities: [
        user,
        sampleEntity({
          relations: [
            { type: 'many-to-one', target: 'User', fieldName: 'author' },
            { type: 'many-to-one', target: 'User', fieldName: 'editor' },
          ],
        }),
      ],
    }));

    assert.match(schema, /posts\s+Post\[\] @relation\("([^"]+)"\)/);
    assert.match(schema, /editorPosts\s+Post\[\] @relation\("([^"]+)"\)/);
    assert.equal(new Set(relationNames(schema)).size, 2);
  });

  it('renames a Prisma foreign key that would collide with a scalar field', () => {
    const schema = renderPrismaSchema(sampleConfig({
      orm: 'prisma',
      entities: [
        user,
        sampleEntity({
          fields: [title, { ...title, name: 'authorId' }],
          relations: [{ type: 'many-to-one', target: 'User', fieldName: 'author' }],
        }),
      ],
    }));

    assert.match(schema, /authorId\s+String/);
    assert.match(schema, /authorRefId\s+Int/);
    assert.match(schema, /fields: \[authorRefId\]/);
  });

  it('pairs a self-relation instead of adding a second copy', () => {
    const schema = renderPrismaSchema(sampleConfig({
      orm: 'prisma',
      entities: [
        sampleEntity({
          name: 'User',
          fields: [],
          relations: [
            { type: 'many-to-one', target: 'User', fieldName: 'manager' },
            { type: 'one-to-many', target: 'User', fieldName: 'reports' },
          ],
        }),
      ],
    }));

    assert.match(schema, /manager\s+User @relation\("/);
    assert.match(schema, /reports\s+User\[\] @relation\("/);
    assert.equal((schema.match(/User\[\]/g) ?? []).length, 1);
    assert.equal(new Set(relationNames(schema)).size, 1);
  });
});
