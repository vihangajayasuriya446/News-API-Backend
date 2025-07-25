import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configure environment variables
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available app-wide
      envFilePath: '.env', // Explicitly point to .env file
    }),

    // Configure TypeORM with async configuration using ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'), // Fallback to 'localhost' if not set
        port: configService.get<number>('DB_PORT', 3306), // Fallback to 3306
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_NAME', 'derana_news'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Keep false in production!
        
        logging: configService.get<string>('NODE_ENV') === 'development',
        autoLoadEntities: true,
      }),
    }),

    // other modules (AuthModule, UsersModule, etc.) would go here
    // AuthModule,
    // UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}