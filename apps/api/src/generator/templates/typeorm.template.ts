import { ProjectConfig } from '@ns/shared';
import { tsSingleQuoted } from './escape';

export function renderTypeOrmConfig(config: ProjectConfig): string {
  const dbTypeMap: Record<string, string> = {
    mysql: 'mysql', postgres: 'postgres', sqlite: 'better-sqlite3', mongodb: 'mongodb',
  };

  return `import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  useFactory: () => ({
    type: '${dbTypeMap[config.database]}' as any,
    ${connectionFields(config)}
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
  }),
};
`;
}

function connectionFields(config: ProjectConfig): string {
  if (config.database === 'sqlite') {
    return "database: process.env.DATABASE_URL ?? './database.sqlite',";
  }
  if (config.database === 'mongodb') {
    const fallback = `mongodb://localhost:27017/${encodeURIComponent(config.name)}`;
    return `url: process.env.DATABASE_URL ?? '${fallback}',`;
  }
  const port = config.database === 'mysql' ? 3306 : 5432;
  return `host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '${port}', 10),
    username: process.env.DB_USER ?? 'user',
    password: process.env.DB_PASSWORD ?? 'password',
    database: process.env.DB_NAME ?? ${tsSingleQuoted(config.name)},`;
}
