// 목적: reservations 쿼리(커서 페이지네이션) + 확정/강취 뮤테이션 + 연결 필드(DataLoader)
import {
  Resolver,
  Query,
  Args,
  Mutation,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsArgs } from './dto/reservations.args';
import { ReservationActionInput } from './dto/actions.input';
import {
  ReservationConnection,
  ReservationNode,
  UserSummary,
  EventSummary,
  SeatSummary,
  PaymentSummary,
} from './dto/reservation.types';
import { GqlAuthGuard } from '../common/auth/gql-auth.guard';
import { DataloadersFactory } from '../common/loaders/dataloaders.factory';
import { ReservationClient } from '../clients/reservation.client';

//@UseGuards(GqlAuthGuard)
@Resolver(() => ReservationNode)
export class ReservationsResolver {
  constructor(
    private readonly svc: ReservationsService,
    private readonly rc: ReservationClient,
    private readonly loadersFactory: DataloadersFactory,
  ) {}

  // Query
  @Query(() => ReservationConnection, {
    description: '공연별 예약 목록(커서 페이지네이션)',
  })
  async reservations(
    @Args() args: ReservationsArgs,
  ): Promise<ReservationConnection> {
    const { nodes, endCursor, hasNextPage } =
      await this.svc.findReservations(args);
    // GraphQL 노드 형태로 변환(연결 필드는 아래 ResolveField에서 DataLoader로 로드)
    const gNodes: ReservationNode[] = nodes.map(
      (r: any) =>
        ({
          id: r.id,
          status: r.status as any,
          createdAt: r.createdAt as any,
          // ── 내부 프로퍼티(스키마 비노출): 필드 리졸버에서 사용
          _userId: r.userId,
          _eventId: r.eventId,
          _seatId: r.seatId,
        }) as any,
    );

    return { nodes: gNodes, endCursor, hasNextPage };
  }

  // Mutations
  @Mutation(() => Boolean, { description: '예약 확정(운영자)' })
  async confirmReservation(@Args('input') input: ReservationActionInput) {
    await this.rc.confirm(input.id);
    return true;
  }

  @Mutation(() => Boolean, { description: '예약 강제 취소(운영자)' })
  async forceCancelReservation(@Args('input') input: ReservationActionInput) {
    await this.rc.forceCancel(input.id);
    return true;
  }

  @ResolveField(() => UserSummary)
  async user(
    @Parent() node: ReservationNode,
    @Context() ctx: any,
  ): Promise<UserSummary> {
    const loader = (ctx.userLoader ??= this.loadersFactory.userByIdLoader());
    const userId = (node as any)._userId;
    if (!userId) throw new Error('Reservation node missing _userId');
    const row = await loader.load(userId);
    return { id: row!.id, email: row!.email, name: row!.name ?? undefined };
  }

  @ResolveField(() => EventSummary)
  async event(
    @Parent() node: ReservationNode,
    @Context() ctx: any,
  ): Promise<EventSummary> {
    const loader = (ctx.eventLoader ??= this.loadersFactory.eventByIdLoader());
    const eventId = (node as any)._eventId;
    if (!eventId) throw new Error('Reservation node missing _eventId');
    const row = await loader.load(eventId);
    return {
      id: row!.id,
      title: row!.title,
      startDate: row!.startDate,
      endDate: row!.endDate,
      openAt: row!.openAt,
    };
  }

  @ResolveField(() => SeatSummary)
  async seat(
    @Parent() node: ReservationNode,
    @Context() ctx: any,
  ): Promise<SeatSummary> {
    const loader = (ctx.seatLoader ??= this.loadersFactory.seatByIdLoader());
    const seatId = (node as any)._seatId;
    if (!seatId) throw new Error('Reservation node missing _seatId');
    const row = await loader.load(seatId);
    return {
      id: row!.id,
      section: row!.section,
      row: row!.row,
      number: row!.number,
      grade: row!.grade,
    };
  }

  @ResolveField(() => PaymentSummary, { nullable: true })
  async payment(
    @Parent() node: ReservationNode,
    @Context() ctx: any,
  ): Promise<PaymentSummary | null> {
    const loader = (ctx.paymentLoader ??=
      this.loadersFactory.paymentByReservationIdLoader());
    const row = await loader.load((node as any).id); // 예약 id로 조회
    if (!row) return null;
    return { id: row.id, paymentMethod: row.paymentMethod, paidAt: row.paidAt };
  }

  // 내부 헬퍼: 최초 nodes에는 원시 FK가 없으므로(표면 타입 분리) 필요 시 백킹 row를 읽도록 확장 가능
  private async _readBacking(_node: ReservationNode) {
    // 필요 시 확장: 현재는 repo에서 반환 받은 row에서 매핑하도록 개선 가능
    return _node as any;
  }
}
