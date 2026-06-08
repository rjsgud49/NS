import { ProjectConfig } from '@ns/shared';

export function renderPackageJson(config: ProjectConfig): string {
  const deps: Record<string, string> = {
    '@nestjs/common': '^10.3.10',
    '@nestjs/config': '^3.2.3',
    '@nestjs/core': '^10.3.10',
    '@nestjs/platform-express': '^10.3.10',
    'joi': '^17.13.1',
    'reflect-metadata': '^0.2.2',
    'rxjs': '^7.8.1',
  };

  const devDeps: Record<string, string> = {
    '@nestjs/cli': '^10.4.2',
    '@types/node': '^20.14.2',
    'typescript': '^5.4.5',
  };

  if (config.orm === 'typeorm') {
    deps['@nestjs/typeorm'] = '^10.0.2';
    deps['typeorm'] = '^0.3.20';
    deps['mysql2'] = config.database === 'mysql' ? '^3.9.7' : undefined;
    deps['pg'] = config.database === 'postgres' ? '^8.12.0' : undefined;
    deps['better-sqlite3'] = config.database === 'sqlite' ? '^9.6.0' : undefined;
    devDeps['@types/better-sqlite3'] = config.database === 'sqlite' ? '^7.6.11' : undefined;
    Object.keys(deps).forEach((k) => deps[k] === undefined && delete deps[k]);
  }

  if (config.orm === 'prisma') {
    deps['@prisma/client'] = '^5.16.1';
    devDeps['prisma'] = '^5.16.1';
  }

  if (config.auth !== 'none') {
    deps['@nestjs/jwt'] = '^10.2.0';
    deps['@nestjs/passport'] = '^10.0.3';
    deps['passport'] = '^0.7.0';
    deps['passport-jwt'] = '^4.0.1';
    deps['bcrypt'] = '^5.1.1';
    devDeps['@types/bcrypt'] = '^5.0.2';
    devDeps['@types/passport-jwt'] = '^4.0.1';
  }

  if (config.features.swagger) {
    deps['@nestjs/swagger'] = '^7.3.1';
  }

  if (config.features.validation) {
    deps['class-validator'] = '^0.14.1';
    deps['class-transformer'] = '^0.5.1';
  }

  if (config.features.rateLimit) {
    deps['@nestjs/throttler'] = '^5.1.2';
  }

  const pkg = {
    name: config.name,
    version: '0.0.1',
    description: config.description,
    scripts: {
      build: 'nest build',
      start: 'node dist/main',
      'start:dev': 'nest start --watch',
      'start:prod': 'node dist/main',
    },
    dependencies: sortObj(deps),
    devDependencies: sortObj(devDeps),
  };

  return JSON.stringify(pkg, null, 2);
}

function sortObj(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}
