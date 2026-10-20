import { ProjectConfig } from '@ns/shared';
import * as crypto from 'crypto';

export interface EnvSecrets {
  jwt: string;
  refresh: string;
}

export interface EnvRenderOptions {
  example?: boolean;
  secrets?: EnvSecrets;
}

export function createEnvSecrets(): EnvSecrets {
  return {
    jwt: crypto.randomBytes(32).toString('hex'),
    refresh: crypto.randomBytes(32).toString('hex'),
  };
}

export function renderEnv(config: ProjectConfig, options: EnvRenderOptions = {}): string {
  const lines: string[] = [envLine('PORT', String(config.port))];

  if (config.orm === 'typeorm' || config.orm === 'prisma') {
    lines.push(envLine('DATABASE_URL', databaseUrl(config)));
    if (config.orm === 'typeorm' && config.database !== 'sqlite') {
      lines.push(envLine('DB_HOST', 'localhost'));
      lines.push(envLine('DB_PORT', config.database === 'mysql' ? '3306' : '5432'));
      lines.push(envLine('DB_USER', 'user'));
      lines.push(envLine('DB_PASSWORD', 'password'));
      lines.push(envLine('DB_NAME', config.name));
    }
  }

  if (config.auth !== 'none') {
    const secrets = options.secrets ?? createEnvSecrets();
    lines.push(envLine('JWT_SECRET', options.example ? 'change-me' : secrets.jwt));
    lines.push(envLine('JWT_EXPIRES_IN', '15m'));
    if (config.auth === 'jwt-refresh' || config.auth === 'jwt-refresh-roles') {
      lines.push(envLine('JWT_REFRESH_SECRET', options.example ? 'change-me-refresh' : secrets.refresh));
      lines.push(envLine('JWT_REFRESH_EXPIRES_IN', '7d'));
    }
  }

  return lines.join('\n') + '\n';
}

function databaseUrl(config: ProjectConfig): string {
  const name = encodeURIComponent(config.name);
  const dbMap: Record<string, string> = {
    mysql: `mysql://user:password@localhost:3306/${name}`,
    postgres: `postgresql://user:password@localhost:5432/${name}`,
    sqlite: './database.sqlite',
    mongodb: `mongodb://localhost:27017/${name}`,
  };
  return dbMap[config.database] ?? '';
}

function envLine(key: string, value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
  return `${key}="${escaped}"`;
}
