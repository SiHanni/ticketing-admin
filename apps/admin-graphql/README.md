### 작업 일지

1. 프로젝트 생성

```
# NestJS 앱 생성 (pnpm)
pnpm dlx @nestjs/cli new apps/admin-graphql --package-manager=pnpm
```

2. 패키지 설치

```
# GraphQL/Apollo v4 (code-first)
pnpm add @nestjs/graphql@13 @nestjs/apollo@13 graphql@16.8.1 @apollo/server@4.11.2

# Subscriptions (2차에서 사용)
pnpm add graphql-ws@5 graphql-subscriptions@2 ws

# Validation
pnpm add class-validator class-transformer

# DB (MySQL) + TypeORM (여러 커넥션)
pnpm add typeorm mysql2 reflect-metadata

# 인증/인가 (ADMIN 가드용)
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt

# N+1 방지
pnpm add dataloader

# (선택) 복잡도 제한
pnpm add graphql-query-complexity

```

3. main에서 모듈 및 서버 세팅
4. 예약 리스트 작업

- Query: reservations(first, after, status, eventId, userEmail, createdFrom?, createdTo?)
- 반환: ReservationConnection { nodes[], endCursor, hasNextPage } (Keyset 커서)
- 필드 리졸버(DataLoader): node.user, node.event, node.seat, node.payment
- Mutation: confirmReservation(id), forceCancelReservation(id) → reservation-service REST 호출
- ADMIN 전용 접근: GqlAuthGuard(roles에 admin 필수)
