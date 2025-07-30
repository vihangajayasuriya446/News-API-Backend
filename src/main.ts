import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable CORS configuration
  app.enableCors({
    origin: 'http://localhost:3001', // <--- IMPORTANT: Allow your frontend's exact origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE, OPTIONS', // Allow common HTTP methods
    credentials: true, // Allow cookies and authorization headers (like your JWT token)
  });
  
  await app.listen(3000);
}
bootstrap();