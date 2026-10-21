import { ProjectConfig, EntityConfig } from '@ns/shared';
import { GeneratedFile } from '../types';
import { ResolvedRelation, resolveRelations } from './relations';

function toPascal(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function idLine(config: ProjectConfig): string {
  if (config.database === 'mongodb') {
    return '  id        String   @id @default(auto()) @map("_id") @db.ObjectId';
  }
  return '  id        Int      @id @default(autoincrement())';
}

function foreignKeyType(config: ProjectConfig): string {
  return config.database === 'mongodb' ? 'String   @db.ObjectId' : 'Int';
}

function fieldToColumnType(type: string): string {
  const map: Record<string, string> = {
    string: 'String', number: 'Int', boolean: 'Boolean',
    date: 'DateTime', text: 'String', float: 'Float', json: 'Json',
  };
  return map[type] ?? 'String';
}

export function renderPrismaSchema(config: ProjectConfig): string {
  const providerMap: Record<string, string> = {
    mysql: 'mysql', postgres: 'postgresql', sqlite: 'sqlite', mongodb: 'mongodb',
  };

  const resolved = resolveRelations(config.entities, 'prisma');
  const models = config.entities
    .map((entity) => renderModel(entity, config, resolved.get(entity.name) ?? []))
    .join('\n\n');

  return `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${providerMap[config.database]}"
  url      = env("DATABASE_URL")
}

${models}
`;
}

export function renderPrismaClientFiles(): GeneratedFile[] {
  return [
    { path: 'src/prisma/prisma.service.ts', content: renderPrismaService() },
    { path: 'src/prisma/prisma.module.ts', content: renderPrismaModule() },
  ];
}

function renderPrismaService(): string {
  return `import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
`;
}

function renderPrismaModule(): string {
  return `import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
`;
}

function renderModel(entity: EntityConfig, config: ProjectConfig, relations: ResolvedRelation[]): string {
  const pascal = toPascal(entity.name);

  // Regular fields
  const fieldLines = entity.fields.map((f) => {
    const type = fieldToColumnType(f.type);
    const optional = f.isOptional ? '?' : '';
    const unique = f.isUnique ? ' @unique' : '';
    return `  ${f.name}  ${type}${optional}${unique}`;
  });

  // Relation fields + foreign keys. Every relation names its opposite field.
  const relationLines: string[] = [];
  relations.forEach((relation) => {
    const targetPascal = toPascal(relation.target);
    if (!relation.relationName) return;

    if (relation.type === 'many-to-one') {
      const fkField = relation.fkName ?? `${relation.fieldName}Id`;
      relationLines.push(`  ${fkField}  ${foreignKeyType(config)}`);
      relationLines.push(
        `  ${relation.fieldName}  ${targetPascal} @relation("${relation.relationName}", fields: [${fkField}], references: [id])`,
      );
      return;
    }

    relationLines.push(
      `  ${relation.fieldName}  ${targetPascal}[] @relation("${relation.relationName}")`,
    );
  });

  const allFields = [...fieldLines, ...relationLines];

  return `model ${pascal} {
${idLine(config)}
${allFields.map((l) => l).join('\n')}
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`;
}
