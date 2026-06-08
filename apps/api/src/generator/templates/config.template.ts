import { ProjectConfig } from '@ns/shared';
import { GeneratedFile } from '../types';

export function renderConfigFiles(config: ProjectConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  files.push({ path: 'src/config/configuration.ts', content: renderConfiguration(config) });
  files.push({ path: 'src/config/env.validation.ts', content: renderEnvValidation(config) });
  return files;
}

function renderConfiguration(config: ProjectConfig): string {
  const dbSection = config.orm !== 'prisma' && config.database !== 'sqlite' && config.database !== 'mongodb'
    ? `
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '${config.database === 'mysql' ? '3306' : '5432'}', 10),
    username: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password',
    name: process.env.DB_NAME || '${config.name}',
  },`
    : `\n  databaseUrl: process.env.DATABASE_URL,`;

  const jwtSection = config.auth !== 'none'
    ? `
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',${config.auth === 'jwt-refresh' || config.auth === 'jwt-refresh-roles' ? `
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',` : ''}
  },`
    : '';

  return `export default () => ({
  port: parseInt(process.env.PORT || '${config.port}', 10),${dbSection}${jwtSection}
});
`;
}

function renderEnvValidation(config: ProjectConfig): string {
  const lines: string[] = [`  PORT: Joi.number().default(${config.port}),`];

  if (config.database !== 'sqlite') {
    lines.push(`  DATABASE_URL: Joi.string()${config.orm === 'prisma' ? '.required()' : '.optional()'},`);
  }
  if (config.database !== 'sqlite' && config.database !== 'mongodb' && config.orm === 'typeorm') {
    lines.push(`  DB_HOST: Joi.string().default('localhost'),`);
    lines.push(`  DB_PORT: Joi.number().default(${config.database === 'mysql' ? 3306 : 5432}),`);
    lines.push(`  DB_USER: Joi.string().default('user'),`);
    lines.push(`  DB_PASSWORD: Joi.string().default('password'),`);
    lines.push(`  DB_NAME: Joi.string().default('${config.name}'),`);
  }

  if (config.auth !== 'none') {
    lines.push(`  JWT_SECRET: Joi.string().required(),`);
    lines.push(`  JWT_EXPIRES_IN: Joi.string().default('15m'),`);
    if (config.auth === 'jwt-refresh' || config.auth === 'jwt-refresh-roles') {
      lines.push(`  JWT_REFRESH_SECRET: Joi.string().required(),`);
      lines.push(`  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),`);
    }
  }

  return `import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
${lines.join('\n')}
});
`;
}
