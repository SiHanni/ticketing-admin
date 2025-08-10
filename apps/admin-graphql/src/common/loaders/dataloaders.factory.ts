// 목적: 요청 단위(Request scope)로 생성되는 DataLoader 모음.
//       reservations 목록에서 발생하는 N+1 문제를 배치 조회로 해소합니다.
// 사용처: 필드 리졸버(@ResolveField)에서 ctx에 보관된 로더를 통해
//         user/event/seat/payment 연결 필드를 한 번에 로드합니다.

import { Injectable, Scope } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import DataLoader from 'dataloader';

// ─────────────────────────────────────────────────────────────────────────────
// Row 타입 정의(각 서비스 DB에서 읽어오는 최소 컬럼만 정의)
// ─────────────────────────────────────────────────────────────────────────────
type UserRow = {
  id: number;
  email: string;
  name: string | null;
};

type EventRow = {
  id: number;
  title: string;
  startDate: Date;
  endDate: Date;
  openAt: Date;
};

type SeatRow = {
  id: string; // UUID (seat-service와 일치)
  section: string;
  row: number;
  number: number;
  grade: string; // enum 문자열
};

type PaymentRow = {
  id: number;
  reservationId: number;
  paymentMethod: string;
  paidAt: Date;
};

// ─────────────────────────────────────────────────────────────────────────────
// DataLoader 팩토리
// scope: REQUEST → 같은 요청 내에서는 로더가 캐시되어 동일 키 반복 조회를 방지
// ─────────────────────────────────────────────────────────────────────────────
@Injectable({ scope: Scope.REQUEST })
export class DataloadersFactory {
  // 목적: 서비스별 DB 커넥션 주입 (읽기 전용)
  constructor(
    @InjectDataSource('USER_DB') private readonly userDb: DataSource,
    @InjectDataSource('EVENT_DB') private readonly eventDb: DataSource,
    @InjectDataSource('VENUE_DB') private readonly venueDb: DataSource,
    @InjectDataSource('PAYMENT_DB') private readonly paymentDb: DataSource,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // User: id[] → UserRow|null 배치 조회
  // ───────────────────────────────────────────────────────────────────────────
  userByIdLoader() {
    return new DataLoader<number, UserRow | null>(
      async (ids: readonly number[]) => {
        const rows = (await this.userDb.query(
          `SELECT id, email, name
           FROM users
          WHERE id IN (${ids.map(() => '?').join(',')})`,
          ids as any[],
        )) as UserRow[];

        const map = new Map<number, UserRow>(rows.map((r) => [r.id, r]));
        return ids.map((id) => map.get(id) ?? null) as (UserRow | null)[];
      },
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Event: id[] → EventRow|null 배치 조회
  // ───────────────────────────────────────────────────────────────────────────
  eventByIdLoader() {
    return new DataLoader<number, EventRow | null>(
      async (ids: readonly number[]) => {
        const rows = (await this.eventDb.query(
          `SELECT id, title, startDate, endDate, openAt
           FROM events
          WHERE id IN (${ids.map(() => '?').join(',')})`,
          ids as any[],
        )) as EventRow[];

        const map = new Map<number, EventRow>(rows.map((r) => [r.id, r]));
        return ids.map((id) => map.get(id) ?? null) as (EventRow | null)[];
      },
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Seat: uuid[] → SeatRow|null 배치 조회
  // ───────────────────────────────────────────────────────────────────────────
  seatByIdLoader() {
    return new DataLoader<string, SeatRow | null>(
      async (ids: readonly string[]) => {
        const rows = (await this.venueDb.query(
          `SELECT s.id, s.section, s.row, s.number, s.grade
           FROM seats s
          WHERE s.id IN (${ids.map(() => '?').join(',')})`,
          ids as any[],
        )) as SeatRow[];

        const map = new Map<string, SeatRow>(rows.map((r) => [r.id, r]));
        return ids.map((id) => map.get(id) ?? null) as (SeatRow | null)[];
      },
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Payment: reservationId[] → 최신 PaymentRow|null 매핑
  // 현재 스키마상 결제는 "성공 시점"에만 레코드가 생기는 더미 구조이므로,
  // 동일 reservationId가 여러 건일 가능성은 낮으나, 안전하게 최신(paidAt DESC)만 매핑합니다.
  // ───────────────────────────────────────────────────────────────────────────
  paymentByReservationIdLoader() {
    return new DataLoader<number, PaymentRow | null>(
      async (reservationIds: readonly number[]) => {
        const rows = (await this.paymentDb.query(
          `SELECT id, reservationId, paymentMethod, paidAt
           FROM payments
          WHERE reservationId IN (${reservationIds.map(() => '?').join(',')})
          ORDER BY paidAt DESC`,
          reservationIds as any[],
        )) as PaymentRow[];

        const latestByReservation = new Map<number, PaymentRow>();
        for (const r of rows) {
          // 첫 번째(=가장 최근)만 유지
          if (!latestByReservation.has(r.reservationId))
            latestByReservation.set(r.reservationId, r);
        }
        return reservationIds.map(
          (rid) => latestByReservation.get(rid) ?? null,
        ) as (PaymentRow | null)[];
      },
    );
  }
}

// 요청 스코프로 생성하여 요청 동안 캐시.
// 대량 목록에서도 N+1이 배치 조회
