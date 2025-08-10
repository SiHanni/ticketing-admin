// 목적: Guard가 Nest DI로 생성될 수 있도록 provider로 등록
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt'; // ★ 추가
import { ReservationsResolver } from './reservations.resolver';
import { ReservationsService } from './reservations.service';
import { ReservationsRepo } from './reservations.repo';
import { DataloadersFactory } from '../common/loaders/dataloaders.factory';
import { ReservationClient } from '../clients/reservation.client';
import { GqlAuthGuard } from '../common/auth/gql-auth.guard'; // ★ 추가

@Module({
  imports: [
    HttpModule,
    JwtModule.register({}), // ★ Guard가 사용할 JwtService 제공 (secret은 Guard 내부에서 참조)
  ],
  providers: [
    ReservationsResolver,
    ReservationsService,
    ReservationsRepo,
    DataloadersFactory,
    ReservationClient,
    GqlAuthGuard, // ★ provider 등록
  ],
})
export class ReservationsModule {}
