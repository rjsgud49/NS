import { EntityConfig, FieldConfig, ProjectConfig, RelationConfig } from '@ns/shared';

// ── helpers ──────────────────────────────────────────────────────────────────
function toPascal(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function toKebab(str: string) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
}
function toCamel(str: string) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function fieldToTsType(type: string): string {
  const map: Record<string, string> = {
    string: 'string', number: 'number', boolean: 'boolean',
    date: 'Date', text: 'string', float: 'number', json: 'Record<string, any>',
  };
  return map[type] ?? 'string';
}

function fieldToColumnType(type: string): string {
  const map: Record<string, string> = {
    string: 'varchar', number: 'int', boolean: 'boolean',
    date: 'timestamp', text: 'text', float: 'float', json: 'json',
  };
  return map[type] ?? 'varchar';
}

// ── entity ───────────────────────────────────────────────────────────────────
export function renderEntity(entity: EntityConfig, config: ProjectConfig): string {
  const pascal = toPascal(entity.name);
  const relations = entity.relations ?? [];

  if (config.orm === 'typeorm') {
    return renderTypeOrmEntity(pascal, entity, relations);
  }
  return renderPrismaEntityStub(pascal);
}

function renderTypeOrmEntity(
  pascal: string,
  entity: EntityConfig,
  relations: RelationConfig[],
): string {
  // Collect which relation decorators are needed
  const relDecorators = new Set<string>();
  relations.forEach((r) => {
    if (r.type === 'one-to-many') relDecorators.add('OneToMany');
    if (r.type === 'many-to-one') { relDecorators.add('ManyToOne'); relDecorators.add('JoinColumn'); }
    if (r.type === 'many-to-many') { relDecorators.add('ManyToMany'); relDecorators.add('JoinTable'); }
  });

  const typeOrmImports = [
    'Entity', 'PrimaryGeneratedColumn', 'Column',
    'CreateDateColumn', 'UpdateDateColumn',
    ...Array.from(relDecorators),
  ];

  // Import statements for related entities
  const relatedImports = relations.map((r) => {
    const targetPascal = toPascal(r.target);
    const targetKebab = toKebab(r.target);
    const currentKebab = toKebab(entity.name);
    return `import { ${targetPascal} } from '../../${targetKebab}/entities/${targetKebab}.entity';`;
  });

  // Column definitions
  const columns = entity.fields.map((f) => {
    const nullable = f.isOptional ? ', nullable: true' : '';
    const unique = f.isUnique ? ', unique: true' : '';
    return [
      `  @Column({ type: '${fieldToColumnType(f.type)}'${unique}${nullable} })`,
      `  ${f.name}${f.isOptional ? '?' : ''}: ${fieldToTsType(f.type)};`,
    ].join('\n');
  }).join('\n\n');

  // Relation definitions
  const relationProps = relations.map((r) => {
    const targetPascal = toPascal(r.target);
    const targetCamel = toCamel(r.target);

    if (r.type === 'one-to-many') {
      // Assume inverse property on target is camelCase(thisEntity)
      const inverseProp = toCamel(entity.name);
      return [
        `  @OneToMany(() => ${targetPascal}, (${targetCamel}) => ${targetCamel}.${inverseProp})`,
        `  ${r.fieldName}: ${targetPascal}[];`,
      ].join('\n');
    }
    if (r.type === 'many-to-one') {
      const inverseProp = toCamel(entity.name) + 's';
      return [
        `  @ManyToOne(() => ${targetPascal}, (${targetCamel}) => ${targetCamel}.${inverseProp}, { onDelete: 'CASCADE' })`,
        `  @JoinColumn()`,
        `  ${r.fieldName}: ${targetPascal};`,
      ].join('\n');
    }
    if (r.type === 'many-to-many') {
      return [
        `  @ManyToMany(() => ${targetPascal})`,
        `  @JoinTable()`,
        `  ${r.fieldName}: ${targetPascal}[];`,
      ].join('\n');
    }
    return '';
  }).filter(Boolean).join('\n\n');

  const allProps = [columns, relationProps].filter(Boolean).join('\n\n');
  const uniqueRelatedImports = [...new Set(relatedImports)];

  return `import { ${typeOrmImports.join(', ')} } from 'typeorm';
${uniqueRelatedImports.length ? '\n' + uniqueRelatedImports.join('\n') : ''}

@Entity()
export class ${pascal} {
  @PrimaryGeneratedColumn()
  id: number;

${allProps}

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
`;
}

function renderPrismaEntityStub(pascal: string): string {
  return `import { ${pascal} as Prisma${pascal} } from '@prisma/client';\n\nexport class ${pascal} implements Prisma${pascal} {}\n`;
}

// ── DTOs ─────────────────────────────────────────────────────────────────────
export function renderCreateDto(entity: EntityConfig, config: ProjectConfig): string {
  const pascal = toPascal(entity.name);
  const useValidator = config.features.validation;
  const useSwagger = config.features.swagger;

  const fields = entity.fields.map((f) => {
    const lines: string[] = [];
    if (useSwagger) lines.push(`  @ApiProperty(${f.isOptional ? '{ required: false }' : ''})`);
    if (useValidator) {
      lines.push(getValidator(f));
      if (f.isOptional) lines.push('  @IsOptional()');
    }
    lines.push(`  ${f.name}${f.isOptional ? '?' : ''}: ${fieldToTsType(f.type)};`);
    return lines.join('\n');
  }).join('\n\n');

  const validatorImport = useValidator
    ? `import { ${getValidatorImports(entity.fields)} } from 'class-validator';\n`
    : '';
  const swaggerImport = useSwagger
    ? `import { ApiProperty } from '@nestjs/swagger';\n`
    : '';

  return `${validatorImport}${swaggerImport}\nexport class Create${pascal}Dto {\n${fields}\n}\n`;
}

export function renderUpdateDto(entity: EntityConfig): string {
  const pascal = toPascal(entity.name);
  return `import { PartialType } from '@nestjs/mapped-types';\nimport { Create${pascal}Dto } from './create-${toKebab(entity.name)}.dto';\n\nexport class Update${pascal}Dto extends PartialType(Create${pascal}Dto) {}\n`;
}

// ── Service ───────────────────────────────────────────────────────────────────
export function renderService(entity: EntityConfig, config: ProjectConfig): string {
  const pascal = toPascal(entity.name);
  const camel = toCamel(entity.name);
  const kebab = toKebab(entity.name);
  const relations = entity.relations ?? [];

  if (config.orm === 'typeorm') {
    const relationsOption = relations.length
      ? `{ relations: [${relations.map((r) => `'${r.fieldName}'`).join(', ')}] }`
      : '';

    return `import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ${pascal} } from './entities/${kebab}.entity';
import { Create${pascal}Dto } from './dto/create-${kebab}.dto';
import { Update${pascal}Dto } from './dto/update-${kebab}.dto';

@Injectable()
export class ${pascal}Service {
  constructor(
    @InjectRepository(${pascal})
    private readonly repo: Repository<${pascal}>,
  ) {}

  create(dto: Create${pascal}Dto) {
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find(${relationsOption});
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id }${relationsOption ? ', ' + relationsOption : ''} });
    if (!item) throw new NotFoundException(\`${pascal} #\${id} not found\`);
    return item;
  }

  async update(id: number, dto: Update${pascal}Dto) {
    await this.findOne(id);
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.repo.delete(id);
  }
}
`;
  }

  const relationsInclude = relations.length
    ? `{ include: { ${relations.map((r) => `${r.fieldName}: true`).join(', ')} } }`
    : '';

  return `import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Create${pascal}Dto } from './dto/create-${kebab}.dto';
import { Update${pascal}Dto } from './dto/update-${kebab}.dto';

@Injectable()
export class ${pascal}Service {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: Create${pascal}Dto) {
    return this.prisma.${camel}.create({ data: dto });
  }

  findAll() {
    return this.prisma.${camel}.findMany(${relationsInclude});
  }

  async findOne(id: number) {
    const item = await this.prisma.${camel}.findUnique({ where: { id }${relationsInclude ? ', ' + relationsInclude : ''} });
    if (!item) throw new NotFoundException(\`${pascal} #\${id} not found\`);
    return item;
  }

  update(id: number, dto: Update${pascal}Dto) {
    return this.prisma.${camel}.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.${camel}.delete({ where: { id } });
  }
}
`;
}

// ── Controller ────────────────────────────────────────────────────────────────
export function renderController(entity: EntityConfig, config: ProjectConfig): string {
  const pascal = toPascal(entity.name);
  const camel = toCamel(entity.name);
  const kebab = toKebab(entity.name);

  const swaggerDecorators = config.features.swagger
    ? `import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';\n`
    : '';
  const apiTagsDecorator = config.features.swagger ? `@ApiTags('${kebab}')\n` : '';
  const bearerDecorator = config.auth !== 'none' && config.features.swagger ? `@ApiBearerAuth()\n` : '';
  const authGuardImport = config.auth !== 'none'
    ? `import { UseGuards } from '@nestjs/common';\nimport { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';\n`
    : '';
  const useGuards = config.auth !== 'none' ? `@UseGuards(JwtAuthGuard)\n` : '';

  return `import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
${swaggerDecorators}${authGuardImport}import { ${pascal}Service } from './${kebab}.service';
import { Create${pascal}Dto } from './dto/create-${kebab}.dto';
import { Update${pascal}Dto } from './dto/update-${kebab}.dto';

${apiTagsDecorator}${bearerDecorator}${useGuards}@Controller('${kebab}')
export class ${pascal}Controller {
  constructor(private readonly ${camel}Service: ${pascal}Service) {}

  @Post()
  create(@Body() dto: Create${pascal}Dto) {
    return this.${camel}Service.create(dto);
  }

  @Get()
  findAll() {
    return this.${camel}Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.${camel}Service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Update${pascal}Dto) {
    return this.${camel}Service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.${camel}Service.remove(id);
  }
}
`;
}

// ── Module ────────────────────────────────────────────────────────────────────
export function renderModule(entity: EntityConfig, config: ProjectConfig): string {
  const pascal = toPascal(entity.name);
  const kebab = toKebab(entity.name);

  const typeOrmImport = config.orm === 'typeorm'
    ? `import { TypeOrmModule } from '@nestjs/typeorm';\nimport { ${pascal} } from './entities/${kebab}.entity';\n`
    : '';
  const typeOrmForFeature = config.orm === 'typeorm' ? `TypeOrmModule.forFeature([${pascal}])` : '';

  return `import { Module } from '@nestjs/common';
${typeOrmImport}import { ${pascal}Service } from './${kebab}.service';
import { ${pascal}Controller } from './${kebab}.controller';

@Module({
  imports: [${typeOrmForFeature}],
  controllers: [${pascal}Controller],
  providers: [${pascal}Service],
  exports: [${pascal}Service],
})
export class ${pascal}Module {}
`;
}

// ── validator helpers ─────────────────────────────────────────────────────────
function getValidator(field: FieldConfig): string {
  const map: Record<string, string> = {
    string: '  @IsString()', text: '  @IsString()', number: '  @IsNumber()',
    float: '  @IsNumber()', boolean: '  @IsBoolean()', date: '  @IsDateString()', json: '  @IsObject()',
  };
  return map[field.type] ?? '  @IsString()';
}

function getValidatorImports(fields: FieldConfig[]): string {
  const needed = new Set(['IsOptional']);
  for (const f of fields) {
    const map: Record<string, string> = {
      string: 'IsString', text: 'IsString', number: 'IsNumber',
      float: 'IsNumber', boolean: 'IsBoolean', date: 'IsDateString', json: 'IsObject',
    };
    if (map[f.type]) needed.add(map[f.type]);
  }
  return [...needed].join(', ');
}
