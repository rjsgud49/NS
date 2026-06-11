export type DatabaseType = 'mysql' | 'postgres' | 'sqlite' | 'mongodb';
export type OrmType = 'typeorm' | 'prisma';
export type AuthType = 'none' | 'jwt' | 'jwt-refresh' | 'jwt-refresh-roles';
export type ArchitectureType =
  | 'layered'
  | 'clean'
  | 'hexagonal'
  | 'cqrs'
  | 'ddd'
  | 'microservices';

export type FrontendType = 'react' | 'vue' | 'none';
export type UIFrameworkType = 'shadcn' | 'tailwind' | 'mui' | 'bootstrap';

export interface ProjectConfig {
  name: string;
  description: string;
  port: number;

  database: DatabaseType;
  orm: OrmType;
  auth: AuthType;
  architecture: ArchitectureType;

  features: {
    swagger: boolean;
    validation: boolean;
    cors: boolean;
    rateLimit: boolean;
  };

  frontend: FrontendType;
  uiFramework: UIFrameworkType;

  entities: EntityConfig[];
}

export type RelationType = 'one-to-many' | 'many-to-one' | 'many-to-many';

export interface RelationConfig {
  type: RelationType;
  target: string;
  fieldName: string;
}

export interface EntityConfig {
  name: string;
  fields: FieldConfig[];
  relations: RelationConfig[];
}

export interface FieldConfig {
  name: string;
  type: FieldType;
  isUnique: boolean;
  isOptional: boolean;
  isArray: boolean;
}

export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'text'
  | 'float'
  | 'json';

export interface GenerateRequest {
  config: ProjectConfig;
}
