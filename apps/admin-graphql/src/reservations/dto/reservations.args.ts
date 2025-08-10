import { ArgsType, Field, Int } from '@nestjs/graphql';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsISO8601,
  Min,
  Max,
} from 'class-validator';

export enum ReservationStatusArg {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

@ArgsType()
/**
 * reservations 쿼리의 인자 DTO.
 */
@ArgsType()
export class ReservationsArgs {
  @Field(() => Int, { nullable: true, description: '공연 ID' })
  @IsOptional()
  @IsInt()
  eventId?: number;

  @Field(() => String, { nullable: true, description: '예약 상태' })
  @IsOptional()
  @IsEnum(ReservationStatusArg)
  status?: ReservationStatusArg;

  @Field({
    nullable: true,
    description: '사용자 이메일 검색(부분 문자열 허용)',
  })
  @IsOptional()
  @IsString()
  userEmail?: string;

  @Field({ nullable: true, description: '생성일 시작(ISO8601)' })
  @IsOptional()
  @IsISO8601()
  createdFrom?: string;

  @Field({ nullable: true, description: '생성일 끝(ISO8601)' })
  @IsOptional()
  @IsISO8601()
  createdTo?: string;

  @Field({ nullable: true, description: '커서(내부 인코딩 문자열)' })
  @IsOptional()
  @IsString()
  after?: string;

  @Field(() => Int, { defaultValue: 20, description: '페이지 크기(1~100)' })
  @IsInt()
  @Min(1)
  @Max(100)
  first!: number;
}

// @ArgsType()
// GraphQL 쿼리나 뮤테이션의 Args(인자)로 쓰인다"**는 의미.
// 이 클래스의 각 필드를 GraphQL 인자처럼 매핑
// 이걸 붙이지 않으면, 이 클래스는 GraphQL 스키마에 Args로 등록되지 않습니다.
//
// @Field()
// GraphQL 스키마에서 해당 클래스의 속성을 **필드(Argument)**로 노출시키는 데코레이터
//
