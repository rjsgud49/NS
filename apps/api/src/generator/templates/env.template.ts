import { ProjectConfig } from '@ns/shared';
import * as crypto from 'crypto';

export function renderEnv(config: ProjectConfig): string {
  const lines: string[] = [`PORT=${config.port}`];

  if (config.orm === 'typeorm' || config.orm === 'prisma') {
    const dbMap: Record<string, string> = {
      mysql: `mysql://user:password@localhost:3306/${config.name}`,
      postgres: `postgresql://user:password@localhost:5432/${config.name}`,
      sqlite: './database.sqlite',
      mongodb: `mongodb://localhost:27017/${config.name}`,
    };
    lines.push(`DATABASE_URL="${dbMap[config.database] ?? ''}"`);
    if (config.orm === 'typeorm' && config.database !== 'sqlite') {
      lines.push(`DB_HOST=localhost`);
      lines.push(`DB_PORT=${config.database === 'mysql' ? 3306 : 5432}`);
      lines.push(`DB_USER=user`);
      lines.push(`DB_PASSWORD=password`);
      lines.push(`DB_NAME=${config.name}`);
    }
  }

  if (config.auth !== 'none') {
    const secret = crypto.randomBytes(32).toString('hex');
    lines.push(`JWT_SECRET=${secret}`);
    lines.push(`JWT_EXPIRES_IN=15m`);
    if (config.auth === 'jwt-refresh' || config.auth === 'jwt-refresh-roles') {
      const refreshSecret = crypto.randomBytes(32).toString('hex');
      lines.push(`JWT_REFRESH_SECRET=${refreshSecret}`);
      lines.push(`JWT_REFRESH_EXPIRES_IN=7d`);
    }
  }

  return lines.join('\n') + '\n';
}
