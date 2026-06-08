import { Injectable } from '@nestjs/common';
import { ProjectConfig } from '@ns/shared';
import { GeneratedFile } from '../types';
import { renderPackageJson } from '../templates/package-json.template';
import { renderAppModule } from '../templates/app-module.template';
import { renderMain } from '../templates/main.template';
import { renderEnv } from '../templates/env.template';
import { renderConfigFiles } from '../templates/config.template';
import { renderCommonFiles } from '../templates/common.template';
import {
  renderEntity,
  renderCreateDto,
  renderUpdateDto,
  renderService,
  renderController,
  renderModule,
} from '../templates/crud.template';
import { renderAuthModule } from '../templates/auth.template';
import { renderPrismaSchema } from '../templates/prisma.template';
import { renderTypeOrmConfig } from '../templates/typeorm.template';

@Injectable()
export class FileTreeService {
  build(config: ProjectConfig): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // ── Root config files
    files.push({ path: 'package.json', content: renderPackageJson(config) });
    files.push({ path: 'tsconfig.json', content: renderTsConfig() });
    files.push({ path: 'nest-cli.json', content: renderNestCli() });
    files.push({ path: '.env', content: renderEnv(config) });
    files.push({ path: '.env.example', content: renderEnv(config) });
    files.push({ path: '.gitignore', content: renderGitignore() });

    // ── Core source files
    files.push({ path: 'src/main.ts', content: renderMain(config) });
    files.push({ path: 'src/app.module.ts', content: renderAppModule(config) });

    // ── Config module (always included)
    files.push(...renderConfigFiles(config));

    // ── Common filters + interceptors (always included)
    files.push(...renderCommonFiles());

    // ── ORM config
    if (config.orm === 'typeorm') {
      files.push({ path: 'src/config/typeorm.config.ts', content: renderTypeOrmConfig(config) });
    }
    if (config.orm === 'prisma') {
      files.push({ path: 'prisma/schema.prisma', content: renderPrismaSchema(config) });
    }

    // ── Auth module
    if (config.auth !== 'none') {
      files.push(...renderAuthModule(config));
    }

    // ── Entity CRUD modules
    for (const entity of config.entities) {
      const kebab = toKebab(entity.name);
      const base = `src/${kebab}`;
      files.push({ path: `${base}/entities/${kebab}.entity.ts`, content: renderEntity(entity, config) });
      files.push({ path: `${base}/dto/create-${kebab}.dto.ts`, content: renderCreateDto(entity, config) });
      files.push({ path: `${base}/dto/update-${kebab}.dto.ts`, content: renderUpdateDto(entity) });
      files.push({ path: `${base}/${kebab}.service.ts`, content: renderService(entity, config) });
      files.push({ path: `${base}/${kebab}.controller.ts`, content: renderController(entity, config) });
      files.push({ path: `${base}/${kebab}.module.ts`, content: renderModule(entity, config) });
    }

    return files;
  }
}

function toKebab(str: string) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
}

function renderTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        module: 'commonjs',
        declaration: true,
        removeComments: true,
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        allowSyntheticDefaultImports: true,
        target: 'ES2021',
        sourceMap: true,
        outDir: './dist',
        baseUrl: './',
        incremental: true,
        skipLibCheck: true,
        strictNullChecks: false,
        noImplicitAny: false,
      },
    },
    null,
    2,
  );
}

function renderNestCli(): string {
  return JSON.stringify(
    {
      $schema: 'https://json.schemastore.org/nest-cli',
      collection: '@nestjs/schematics',
      sourceRoot: 'src',
      compilerOptions: { deleteOutDir: true },
    },
    null,
    2,
  );
}

function renderGitignore(): string {
  return `node_modules\ndist\n.env\n*.log\n.DS_Store\n`;
}
