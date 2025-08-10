import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MultiDbModule } from './database/typeorm.module';
import { HelloModule } from './common/hello/hello.module';
import { JwtModule } from '@nestjs/jwt';
import { ReservationsModule } from './reservations/reservations.module';
import { join } from 'path';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      subscriptions: { 'graphql-ws': true },
      context: ({ req, res }) => ({
        req,
        res,
        token: req.headers.authorization?.replace(/^Bearer\s+/i, ''),
      }),
    }),
    JwtModule.register({}),
    MultiDbModule,
    ReservationsModule,
    HelloModule,
  ],
  providers: [
    { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true }) },
  ],
})
export class AppModule {}
