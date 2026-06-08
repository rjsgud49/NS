import { ProjectConfig } from '@ns/shared';

export function renderMain(config: ProjectConfig): string {
  const lines: string[] = [];

  lines.push(`import { NestFactory } from '@nestjs/core';`);
  lines.push(`import { AppModule } from './app.module';`);
  lines.push(`import { HttpExceptionFilter } from './common/filters/http-exception.filter';`);
  lines.push(`import { TransformInterceptor } from './common/interceptors/transform.interceptor';`);

  if (config.features.swagger) {
    lines.push(`import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';`);
  }
  if (config.features.validation) {
    lines.push(`import { ValidationPipe } from '@nestjs/common';`);
  }

  lines.push('');
  lines.push('async function bootstrap() {');
  lines.push('  const app = await NestFactory.create(AppModule);');

  if (config.features.cors) {
    lines.push('  app.enableCors();');
  }

  // Global filter + interceptor — always
  lines.push('  app.useGlobalFilters(new HttpExceptionFilter());');
  lines.push('  app.useGlobalInterceptors(new TransformInterceptor());');

  if (config.features.validation) {
    lines.push('  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));');
  }

  if (config.features.swagger) {
    lines.push('');
    lines.push('  const swaggerConfig = new DocumentBuilder()');
    lines.push(`    .setTitle('${config.name} API')`);
    lines.push(`    .setDescription('${config.description || config.name + ' API documentation'}')`);
    lines.push(`    .setVersion('1.0')`);
    if (config.auth !== 'none') {
      lines.push(`    .addBearerAuth()`);
    }
    lines.push(`    .build();`);
    lines.push(`  const document = SwaggerModule.createDocument(app, swaggerConfig);`);
    lines.push(`  SwaggerModule.setup('api', app, document);`);
  }

  lines.push('');
  lines.push(`  await app.listen(process.env.PORT ?? ${config.port});`);
  lines.push(`  console.log(\`Server running on http://localhost:\${process.env.PORT ?? ${config.port}}\`);`);
  lines.push('}');
  lines.push('bootstrap();');

  return lines.join('\n') + '\n';
}
