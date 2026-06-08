import { ProjectConfig, EntityConfig } from '@ns/shared';

function toPascal(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function toCamel(str: string) {
  return str.charAt(0).toLowerCase() + str.slice(1);
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

  const models = config.entities.map((entity) => renderModel(entity, config)).join('\n\n');

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

function renderModel(entity: EntityConfig, config: ProjectConfig): string {
  const pascal = toPascal(entity.name);
  const relations = entity.relations ?? [];

  // Regular fields
  const fieldLines = entity.fields.map((f) => {
    const type = fieldToColumnType(f.type);
    const optional = f.isOptional ? '?' : '';
    const unique = f.isUnique ? ' @unique' : '';
    return `  ${f.name}  ${type}${optional}${unique}`;
  });

  // Relation fields + foreign keys
  const relationLines: string[] = [];
  relations.forEach((r) => {
    const targetPascal = toPascal(r.target);
    const targetCamel = toCamel(r.target);

    if (r.type === 'one-to-many') {
      // This side: array of targets
      relationLines.push(`  ${r.fieldName}  ${targetPascal}[]`);
    } else if (r.type === 'many-to-one') {
      // This side: single target + foreign key column
      const fkField = `${r.fieldName}Id`;
      relationLines.push(`  ${fkField}  Int`);
      relationLines.push(`  ${r.fieldName}  ${targetPascal} @relation(fields: [${fkField}], references: [id])`);
    } else if (r.type === 'many-to-many') {
      // Prisma handles implicit join table automatically when both sides declare []
      relationLines.push(`  ${r.fieldName}  ${targetPascal}[]`);
    }
  });

  const allFields = [...fieldLines, ...relationLines];

  return `model ${pascal} {
  id        Int      @id @default(autoincrement())
${allFields.map((l) => l).join('\n')}
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`;
}
