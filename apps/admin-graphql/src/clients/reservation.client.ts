// 목적: 상태 변경은 원 서비스(RESERVATION API)에 위임
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const BASE = process.env.RESERVATION_API_BASE || 'http://localhost:3002';

@Injectable()
export class ReservationClient {
  constructor(private readonly http: HttpService) {}

  async confirm(id: number) {
    const { data } = await firstValueFrom(
      this.http.post(`${BASE}/reservations/${id}/confirm`),
    );
    return data;
  }
  async forceCancel(id: number) {
    const { data } = await firstValueFrom(
      this.http.post(`${BASE}/reservations/${id}/force-cancel`),
    );
    return data;
  }
}
