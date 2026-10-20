import { EntityConfig, ProjectConfig } from '@ns/shared';

export function sampleConfig(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    name: 'my-nest-app',
    description: '',
    port: 3000,
    database: 'postgres',
    orm: 'typeorm',
    auth: 'jwt',
    architecture: 'layered',
    frontend: 'react',
    uiFramework: 'tailwind',
    entities: [],
    ...overrides,
    features: {
      swagger: true,
      validation: true,
      cors: true,
      rateLimit: false,
      ...overrides.features,
    },
  };
}

export function sampleEntity(overrides: Partial<EntityConfig> = {}): EntityConfig {
  return {
    name: 'Post',
    fields: [
      { name: 'title', type: 'string', isUnique: false, isOptional: false, isArray: false },
    ],
    relations: [],
    ...overrides,
  };
}
