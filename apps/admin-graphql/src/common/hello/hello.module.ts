// apps/admin-graphql/src/common/hello/hello.module.ts
// 목적: 서버 상태 확인용 가벼운 쿼리/뮤테이션
import { Module } from '@nestjs/common';
import { HelloResolver } from './hello.resolver';

@Module({ providers: [HelloResolver] })
export class HelloModule {}
