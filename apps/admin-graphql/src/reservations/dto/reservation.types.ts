// 목적 : GraphQL 출력 타입(노드/커넥션/요약 서브타입)
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}
registerEnumType(ReservationStatus, { name: 'ReservationStatus' });

// GraphQL 출력 타입.
@ObjectType()
export class UserSummary {
  @Field(() => ID) id!: number;
  @Field() email!: string;
  @Field({ nullable: true }) name?: string;
}

@ObjectType()
export class EventSummary {
  @Field(() => ID) id!: number;
  @Field() title!: string;
  @Field() startDate!: Date;
  @Field() endDate!: Date;
  @Field() openAt!: Date;
}

@ObjectType()
export class SeatSummary {
  @Field(() => ID) id!: string; // UUID
  @Field() section!: string;
  @Field() row!: number;
  @Field() number!: number;
  @Field() grade!: string;
}

@ObjectType()
export class PaymentSummary {
  @Field(() => ID) id!: number;
  @Field() paymentMethod!: string;
  @Field() paidAt!: Date;
}

@ObjectType()
export class ReservationNode {
  @Field(() => ID) id!: number;
  @Field(() => ReservationStatus) status!: ReservationStatus;
  @Field() createdAt!: Date;

  @Field(() => UserSummary) user!: UserSummary;
  @Field(() => EventSummary) event!: EventSummary;
  @Field(() => SeatSummary) seat!: SeatSummary;
  @Field(() => PaymentSummary, { nullable: true }) payment?: PaymentSummary;
}

@ObjectType()
export class ReservationConnection {
  @Field(() => [ReservationNode]) nodes!: ReservationNode[];
  @Field({ nullable: true }) endCursor?: string;
  @Field() hasNextPage!: boolean;
}
