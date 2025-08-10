// apps/admin-graphql/src/common/hello/hello.resolver.ts
// 목적: 상태 점검 (코드-퍼스트 GraphQL 테스트)
import { Resolver, Query, Mutation } from '@nestjs/graphql';

@Resolver()
export class HelloResolver {
  @Query(() => String, { description: '상태 점검용 쿼리' })
  hello() {
    return 'Hello Admin GraphQL!';
  }

  @Mutation(() => String, { description: '핑퐁 테스트' })
  ping() {
    return 'pong';
  }
}
