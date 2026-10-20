import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';

export const WEB_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

export function configureApp(app: INestApplication) {
  app.enableCors({ origin: WEB_ORIGINS });
  app.setGlobalPrefix('api');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.listen(4000);
  console.log('API server running on http://localhost:4000');
}

if (require.main === module) {
  bootstrap();
}
