import { ProjectConfig } from '@ns/shared';

export function renderTypeOrmConfig(config: ProjectConfig): string {
  const dbTypeMap: Record<string, string> = {
    mysql: 'mysql', postgres: 'postgres', sqlite: 'better-sqlite3', mongodb: 'mongodb',
  };

  return `import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  useFactory: () => ({
    type: '${dbTypeMap[config.database]}' as any,
    ${config.database === 'sqlite'
      ? "database: process.env.DATABASE_URL ?? 'database.sqlite',"
      : `host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '${config.database === 'mysql' ? 3306 : 5432}'),
    username: process.env.DB_USER ?? 'user',
    password: process.env.DB_PASSWORD ?? 'password',
    database: process.env.DB_NAME ?? '${config.name}',`}
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
  }),
};
`;
}
