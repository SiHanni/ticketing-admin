// 목적: 운영 액션(확정/취소) 입력
import { Field, Int, InputType } from '@nestjs/graphql';
import { IsInt } from 'class-validator';

// 뮤테이션 입력(confirmReservation, forceCancelReservation)의 id.
@InputType()
export class ReservationActionInput {
  @Field(() => Int)
  @IsInt()
  id!: number;
}
