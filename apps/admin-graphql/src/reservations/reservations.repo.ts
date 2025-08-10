// 목적: RESERVATION_DB에서 필터 + Keyset 페이지네이션으로 예약 목록 조회
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

export type ReservationRow = {
  id: number;
  userId: number;
  eventId: number;
  seatId: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  createdAt: Date;
};

type Keyset = { createdAt: string; id: number }; // 커서의 실체(ISO, number)

function encodeCursor(ks: Keyset): string {
  return Buffer.from(JSON.stringify(ks)).toString('base64url');
}
function decodeCursor(after?: string): Keyset | null {
  if (!after) return null;
  try {
    return JSON.parse(Buffer.from(after, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}
// RESERVATION_DB 직접 조회.
@Injectable()
export class ReservationsRepo {
  constructor(
    @InjectDataSource('RESERVATION_DB') private readonly resDb: DataSource,
  ) {}

  async query(
    params: {
      first: number;
      after?: string;
      eventId?: number;
      status?: string;
      userEmail?: string;
      createdFrom?: string;
      createdTo?: string;
    },
    userIdFilter?: number[], // 이메일로 userId 미리 역조회 시 사용
  ) {
    const limit = Math.min(Math.max(params.first ?? 20, 1), 100) + 1; // hasNextPage 판단 위해 +1
    const ks = decodeCursor(params.after);

    // 기본 WHERE 구성
    const where: string[] = [];
    const args: any[] = [];

    if (params.eventId) {
      where.push('r.eventId = ?');
      args.push(params.eventId);
    }
    if (params.status) {
      where.push('r.status = ?');
      args.push(params.status);
    }
    if (params.createdFrom) {
      where.push('r.createdAt >= ?');
      args.push(new Date(params.createdFrom));
    }
    if (params.createdTo) {
      where.push('r.createdAt <= ?');
      args.push(new Date(params.createdTo));
    }

    if (userIdFilter?.length) {
      where.push(`r.userId IN (${userIdFilter.map(() => '?').join(',')})`);
      args.push(...userIdFilter);
    }

    // Keyset 조건 (createdAt DESC, id DESC)
    if (ks) {
      where.push('(r.createdAt < ? OR (r.createdAt = ? AND r.id < ?))');
      const d = new Date(ks.createdAt);
      args.push(d, d, ks.id);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `SELECT r.id, r.userId, r.eventId, r.seatId, r.status, r.createdAt
         FROM reservations r
        ${whereSql}
        ORDER BY r.createdAt DESC, r.id DESC
        LIMIT ${limit}`;

    const rows = (await this.resDb.query(sql, args)) as ReservationRow[];

    const hasNextPage = rows.length > limit - 1;
    const nodes = hasNextPage ? rows.slice(0, limit - 1) : rows;

    const endCursor = nodes.length
      ? encodeCursor({
          createdAt: nodes[nodes.length - 1].createdAt.toISOString(),
          id: nodes[nodes.length - 1].id,
        })
      : undefined;

    return { nodes, endCursor, hasNextPage };
  }
}
