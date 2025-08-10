// 목적: 예약 목록 조회 조합(이메일→userId 역조회) + 연결 필드 리졸버 헬퍼
import { Injectable } from '@nestjs/common';
import { ReservationsRepo } from './reservations.repo';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly repo: ReservationsRepo,
    @InjectDataSource('USER_DB') private readonly userDb: DataSource,
  ) {}

  async findReservations(args: {
    first: number;
    after?: string;
    status?: string;
    eventId?: number;
    userEmail?: string;
    createdFrom?: string;
    createdTo?: string;
  }) {
    let userIds: number[] | undefined;

    if (args.userEmail?.trim()) {
      const q = args.userEmail.trim();
      const rows = (await this.userDb.query(
        `SELECT id FROM users WHERE email LIKE ?`,
        [`%${q}%`],
      )) as { id: number }[];
      userIds = rows.map((r) => r.id);
      if (userIds.length === 0) {
        return { nodes: [], endCursor: undefined, hasNextPage: false };
      }
    }

    return this.repo.query(args, userIds);
  }
}
