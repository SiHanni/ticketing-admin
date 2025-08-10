import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule); // createApplicationContext ❌
  await app.listen(3000);
  console.log('🚀 GraphQL: http://localhost:3000/graphql');
}
bootstrap();
