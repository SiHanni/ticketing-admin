import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MultiDbModule } from './database/typeorm.module';
import { HelloModule } from './common/hello/hello.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: true,
      subscriptions: { 'graphql-ws': true },
      context: ({ req, res }) => ({
        req,
        res,
        token: req.headers.authorization?.replace(/^Bearer\s+/i, ''),
      }),
    }),
    MultiDbModule,
    HelloModule,
  ],
  providers: [
    { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true }) },
  ],
})
export class AppModule {}
