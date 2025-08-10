// 목적: 서비스별 DB에 “읽기 전용” 커넥션 구성 (user/event/payment/reservation/venue)
import * as dotenv from 'dotenv';
dotenv.config();

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// 각 DB는 엔티티를 스캔하는 경로를 모듈별로 나눌 예정이나,
// 초기에는 공통 경로에서 읽기 전용 쿼리만 수행합니다.
// (실무에선 “명시적 Entity 클래스”를 연결하는 방식을 권장)

@Module({
  imports: [
    TypeOrmModule.forRoot({
      name: 'USER_DB',
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_USER,
      // 읽기 전용 권장: 권한은 MySQL 계정으로 제어 (app 레벨에선 주석)
      autoLoadEntities: false,
      synchronize: false, // 운영 DB에 절대 스키마 변경 금지
    }),
    TypeOrmModule.forRoot({
      name: 'EVENT_DB',
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_EVENT,
      autoLoadEntities: false,
      synchronize: false,
    }),
    TypeOrmModule.forRoot({
      name: 'PAYMENT_DB',
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_PAYMENT,
      autoLoadEntities: false,
      synchronize: false,
    }),
    TypeOrmModule.forRoot({
      name: 'RESERVATION_DB',
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_RESERVATION,
      autoLoadEntities: false,
      synchronize: false,
    }),
    TypeOrmModule.forRoot({
      name: 'VENUE_DB',
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_VENUE, // seat-service의 실제 DB명
      autoLoadEntities: false,
      synchronize: false,
    }),
  ],
  exports: [TypeOrmModule],
})
export class MultiDbModule {}
