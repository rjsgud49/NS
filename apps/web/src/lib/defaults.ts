import { ProjectConfig } from '@ns/shared';

export const defaultConfig: ProjectConfig = {
  name: 'my-nest-app',
  description: '',
  port: 3000,
  database: 'postgres',
  orm: 'typeorm',
  auth: 'jwt',
  architecture: 'layered',
  features: {
    swagger: true,
    validation: true,
    cors: true,
    rateLimit: false,
  },
  frontend: 'react',
  uiFramework: 'tailwind',
  entities: [],
};
