import { BadRequestException } from '@nestjs/common';
import { ProjectConfig } from '@ns/shared';

const DATABASES = new Set(['mysql', 'postgres', 'sqlite', 'mongodb']);
const ORMS = new Set(['typeorm', 'prisma']);
const AUTHS = new Set(['none', 'jwt', 'jwt-refresh', 'jwt-refresh-roles']);
const ARCHITECTURES = new Set(['layered', 'clean', 'hexagonal', 'cqrs', 'ddd', 'microservices']);
const FRONTENDS = new Set(['react', 'vue', 'none']);
const UI_FRAMEWORKS = new Set(['shadcn', 'tailwind', 'mui', 'bootstrap']);
const FIELD_TYPES = new Set(['string', 'number', 'boolean', 'date', 'text', 'float', 'json']);
const RELATION_TYPES = new Set(['one-to-many', 'many-to-one', 'many-to-many']);
const PROJECT_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const IDENTIFIER = /^[A-Za-z][A-Za-z0-9]{0,63}$/;
const RESERVED_FIELDS = new Set(['id', 'createdAt', 'updatedAt']);
const MAX_ENTITIES = 30;
const MAX_FIELDS = 40;
const MAX_RELATIONS = 20;

export function validateProjectConfig(input: unknown): ProjectConfig {
  if (!isRecord(input)) {
    throw new BadRequestException('config 객체가 필요합니다.');
  }

  const errors: string[] = [];
  const name = input.name;
  if (typeof name !== 'string' || !PROJECT_NAME.test(name) || name.includes('..')) {
    errors.push('name은 영문, 숫자, ., _, - 로 64자 이하여야 하며 .. 를 포함할 수 없습니다.');
  }
  if (typeof input.description !== 'string' || input.description.length > 300) {
    errors.push('description은 300자 이하의 문자열이어야 합니다.');
  }
  if (typeof input.port !== 'number' || !Number.isInteger(input.port) || input.port < 1 || input.port > 65535) {
    errors.push('port는 1부터 65535 사이의 정수여야 합니다.');
  }
  requireMember(errors, 'database', input.database, DATABASES);
  requireMember(errors, 'orm', input.orm, ORMS);
  requireMember(errors, 'auth', input.auth, AUTHS);
  requireMember(errors, 'architecture', input.architecture, ARCHITECTURES);
  requireMember(errors, 'frontend', input.frontend, FRONTENDS);
  requireMember(errors, 'uiFramework', input.uiFramework, UI_FRAMEWORKS);
  validateFeatures(errors, input.features);
  validateEntities(errors, input.entities);

  if (errors.length > 0) {
    throw new BadRequestException(errors.join('\n'));
  }
  return input as unknown as ProjectConfig;
}

function validateFeatures(errors: string[], features: unknown) {
  if (!isRecord(features)) {
    errors.push('features 객체가 필요합니다.');
    return;
  }
  for (const key of ['swagger', 'validation', 'cors', 'rateLimit'] as const) {
    if (typeof features[key] !== 'boolean') {
      errors.push(`features.${key}는 boolean이어야 합니다.`);
    }
  }
}

function validateEntities(errors: string[], entities: unknown) {
  if (!Array.isArray(entities)) {
    errors.push('entities는 배열이어야 합니다.');
    return;
  }
  if (entities.length > MAX_ENTITIES) {
    errors.push(`entities는 ${MAX_ENTITIES}개 이하여야 합니다.`);
  }

  const names = new Set<string>();
  for (const entity of entities) {
    if (!isRecord(entity) || typeof entity.name !== 'string') continue;
    names.add(entity.name);
  }

  const seen = new Set<string>();
  entities.forEach((entity, index) => {
    if (!isRecord(entity)) {
      errors.push(`entities[${index}]는 객체여야 합니다.`);
      return;
    }
    const label = typeof entity.name === 'string' && entity.name ? entity.name : `#${index}`;
    if (typeof entity.name !== 'string' || !IDENTIFIER.test(entity.name)) {
      errors.push(`entities[${index}].name은 영문으로 시작하는 식별자여야 합니다.`);
    } else if (seen.has(entity.name)) {
      errors.push(`엔티티 이름 ${entity.name}이 중복되었습니다.`);
    } else {
      seen.add(entity.name);
    }

    if (!Array.isArray(entity.fields)) {
      errors.push(`${label}의 fields는 배열이어야 합니다.`);
    } else {
      if (entity.fields.length > MAX_FIELDS) {
        errors.push(`${label}의 필드는 ${MAX_FIELDS}개 이하여야 합니다.`);
      }
      const fieldNames = new Set<string>();
      entity.fields.forEach((field, fieldIndex) => validateField(errors, label, fieldIndex, field, fieldNames));
    }

    if (!Array.isArray(entity.relations)) {
      errors.push(`${label}의 relations는 배열이어야 합니다.`);
      return;
    }
    if (entity.relations.length > MAX_RELATIONS) {
      errors.push(`${label}의 관계는 ${MAX_RELATIONS}개 이하여야 합니다.`);
    }
    const relationNames = new Set<string>(
      Array.isArray(entity.fields)
        ? entity.fields.flatMap((field) => (isRecord(field) && typeof field.name === 'string' ? [field.name] : []))
        : [],
    );
    entity.relations.forEach((relation, relationIndex) => {
      validateRelation(errors, label, relationIndex, relation, names, relationNames);
    });
  });
}

function validateField(
  errors: string[],
  label: string,
  index: number,
  field: unknown,
  names: Set<string>,
) {
  if (!isRecord(field)) {
    errors.push(`${label}.fields[${index}]는 객체여야 합니다.`);
    return;
  }
  if (typeof field.name !== 'string' || !IDENTIFIER.test(field.name)) {
    errors.push(`${label}.fields[${index}].name은 영문으로 시작하는 식별자여야 합니다.`);
  } else if (RESERVED_FIELDS.has(field.name)) {
    errors.push(`${label}.${field.name}은 자동 생성되는 필드와 이름이 겹칩니다.`);
  } else if (names.has(field.name)) {
    errors.push(`${label}의 필드 ${field.name}이 중복되었습니다.`);
  } else {
    names.add(field.name);
  }
  if (typeof field.type !== 'string' || !FIELD_TYPES.has(field.type)) {
    errors.push(`${label}.fields[${index}].type이 올바르지 않습니다.`);
  }
  for (const key of ['isUnique', 'isOptional', 'isArray'] as const) {
    if (typeof field[key] !== 'boolean') {
      errors.push(`${label}.fields[${index}].${key}는 boolean이어야 합니다.`);
    }
  }
}

function validateRelation(
  errors: string[],
  label: string,
  index: number,
  relation: unknown,
  entityNames: Set<string>,
  usedNames: Set<string>,
) {
  if (!isRecord(relation)) {
    errors.push(`${label}.relations[${index}]는 객체여야 합니다.`);
    return;
  }
  if (typeof relation.type !== 'string' || !RELATION_TYPES.has(relation.type)) {
    errors.push(`${label}.relations[${index}].type이 올바르지 않습니다.`);
  }
  if (typeof relation.target !== 'string' || !entityNames.has(relation.target)) {
    errors.push(`${label}.relations[${index}].target은 존재하는 엔티티여야 합니다.`);
  }
  if (typeof relation.fieldName !== 'string' || !IDENTIFIER.test(relation.fieldName)) {
    errors.push(`${label}.relations[${index}].fieldName은 영문으로 시작하는 식별자여야 합니다.`);
  } else if (RESERVED_FIELDS.has(relation.fieldName) || usedNames.has(relation.fieldName)) {
    errors.push(`${label}의 관계 필드 ${relation.fieldName}이 다른 필드와 겹칩니다.`);
  } else {
    usedNames.add(relation.fieldName);
  }
}

function requireMember(errors: string[], key: string, value: unknown, allowed: Set<string>) {
  if (typeof value !== 'string' || !allowed.has(value)) {
    errors.push(`${key} 값이 올바르지 않습니다.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
