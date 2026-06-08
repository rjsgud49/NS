import { ProjectConfig } from '@ns/shared';

function toKebab(str: string) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
}
function toPascal(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function renderAppModule(config: ProjectConfig): string {
  const imports: string[] = [];
  const moduleImports: string[] = [];

  // ConfigModule — always included
  imports.push(`import { ConfigModule } from '@nestjs/config';`);
  imports.push(`import configuration from './config/configuration';`);
  imports.push(`import { envValidationSchema } from './config/env.validation';`);
  moduleImports.push(
    `ConfigModule.forRoot({\n      isGlobal: true,\n      load: [configuration],\n      validationSchema: envValidationSchema,\n    })`,
  );

  if (config.features.rateLimit) {
    imports.push(`import { ThrottlerModule } from '@nestjs/throttler';`);
    moduleImports.push(`ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])`);
  }

  if (config.orm === 'typeorm') {
    imports.push(`import { TypeOrmModule } from '@nestjs/typeorm';`);
    imports.push(`import { typeOrmConfig } from './config/typeorm.config';`);
    moduleImports.push(`TypeOrmModule.forRootAsync(typeOrmConfig)`);
  }

  if (config.orm === 'prisma') {
    imports.push(`import { PrismaModule } from './prisma/prisma.module';`);
    moduleImports.push(`PrismaModule`);
  }

  if (config.auth !== 'none') {
    imports.push(`import { AuthModule } from './auth/auth.module';`);
    moduleImports.push(`AuthModule`);
  }

  for (const entity of config.entities) {
    const pascal = toPascal(entity.name);
    const kebab = toKebab(entity.name);
    imports.push(`import { ${pascal}Module } from './${kebab}/${kebab}.module';`);
    moduleImports.push(`${pascal}Module`);
  }

  return `import { Module } from '@nestjs/common';
${imports.join('\n')}

@Module({
  imports: [
    ${moduleImports.join(',\n    ')},
  ],
})
export class AppModule {}
`;
}
