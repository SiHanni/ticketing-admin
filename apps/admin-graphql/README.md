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

- 목록 요청 쿼리( 첫페이지 )

```
query {
  reservations(first: 20, eventId: 1, status: "PENDING", userEmail: "naver.com") {
    nodes {
      id
      status
      createdAt
      user { id email name }
      event { id title startDate endDate openAt }
      seat  { id section row number grade }
      payment { id paymentMethod paidAt }
    }
    endCursor
    hasNextPage
  }
}

```

- 다음 페이지

```
query {
  reservations(first: 20, eventId: 1, after: "커서값") {
    nodes { id /* ... */ }
    endCursor
    hasNextPage
  }
}
```

- 확정/ 강제취소

```
mutation { confirmReservation(input: { id: 123 }) }   # true 반환
mutation { forceCancelReservation(input: { id: 123 }) }
```

A. 인증/인가 · 공통
src/common/auth/current-user.decorator.ts

역할: GraphQL 컨텍스트에 가드가 심어 둔 user 정보를 파라미터로 주입하기 위한 데코레이터.

src/common/auth/gql-auth.guard.ts

역할: ADMIN 전용 보호. Authorization 헤더의 JWT를 검증하고, 페이로드의 roles 에 admin이 없으면 차단.

포인트: ADMIN_JWT_SECRET 사용. 통과 시 ctx.user에 페이로드를 실어 줌.

src/common/loaders/dataloaders.factory.ts

역할: 요청 스코프의 DataLoader 생성처. 대량 목록에서 발생하는 N+1을 배치 조회로 흡수.

로더 종류:

userByIdLoader → USER_DB

eventByIdLoader → EVENT_DB

seatByIdLoader → VENUE_DB

paymentByReservationIdLoader → PAYMENT_DB

포인트: 반환 타입을 행 | null로 맞춰 타입 안정성 유지, 한 요청 내 캐시.

B. DB 연결
src/database/typeorm.module.ts

역할: 5개 MySQL DB 읽기 연결을 각각 이름으로 등록 (USER_DB, EVENT_DB, PAYMENT_DB, RESERVATION_DB, VENUE_DB).

포인트: 모두 읽기 전용 전제(권장). 운영 DB에 스키마 변경 금지(synchronize: false).

C. 예약(Reservations) 모듈
src/reservations/dto/reservations.args.ts

역할: reservations 쿼리의 인자 DTO.

필터: eventId, status, userEmail, createdFrom, createdTo, after, first.

포인트: ValidationPipe({ whitelist: true }) 대응을 위해 @IsInt/@IsEnum/@IsOptional 등 검증 데코레이터 필수.

src/reservations/dto/reservation.types.ts

역할: GraphQL 출력 타입.

핵심 타입:

ReservationNode: id, status, createdAt + (필드 리졸버로 합성되는) user, event, seat, payment.

ReservationConnection: nodes[], endCursor, hasNextPage.

src/reservations/dto/actions.input.ts

역할: 뮤테이션 입력(confirmReservation, forceCancelReservation)의 id.

포인트: @IsInt로 whitelist 통과.

src/reservations/reservations.repo.ts

역할: RESERVATION_DB 직접 조회.

주요 기능:

필터(이벤트/상태/기간/유저 ID 목록)

Keyset(커서) 페이지네이션: 정렬 createdAt DESC, id DESC, 커서 디코드 후 createdAt < OR (= AND id <) 조건 적용.

응답: rows → nodes, endCursor, hasNextPage.

src/reservations/reservations.service.ts

역할: 리포지토리 호출 전처리.

주요 기능: userEmail이 들어오면 USER_DB에서 email LIKE로 userId[] 역조회 → repo에 전달.

src/clients/reservation.client.ts

역할: 상태 변경(확정/강취)은 원 서비스 REST 호출로 위임.

환경 변수: RESERVATION_API_BASE.

src/reservations/reservations.resolver.ts

역할: GraphQL 실제 엔드포인트.

구성:

@Query reservations(...) → repo/service로 조회 후, 각 노드에 내부 FK (\_userId/\_eventId/\_seatId)를 심어서 반환

@ResolveField user/event/seat/payment → 요청 스코프 DataLoader로 배치 조회

@Mutation confirmReservation/forceCancelReservation → REST 호출

포인트: FK를 노드에 숨겨두어(\_userId 등) 필드 리졸버에서 키 undefined 문제 방지.

src/reservations/reservations.module.ts

역할: 예약 모듈 조립.

imports: HttpModule, JwtModule.register({})

providers: ReservationsResolver/Service/Repo, DataloadersFactory, ReservationClient, GqlAuthGuard.
