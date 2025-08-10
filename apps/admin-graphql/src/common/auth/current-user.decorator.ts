// 목적/경로: 요청 컨텍스트에서 인증된 관리자 정보를 가져오는 파라미터 데코레이터
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const CurrentUser = createParamDecorator((_d, ctx: ExecutionContext) => {
  const gqlCtx = ctx.getArgByIndex(2);
  return gqlCtx.user;
});

// createParamDecorator
// NestJS에서 컨트롤러 핸들러의 매개변수에 쉽게 값을 주입하기 위해 만드는 커스텀 데코레이터를 생성하는 함수
// (_d, ctx: ExecutionContext)
// createParamDecorator 콜백의 첫 번째 인자 _d는 데코레이터에 넘긴 커스텀 데이터(여기선 사용 안 함 → _로 표시).
// 두 번째 인자 ctx는 ExecutionContext로, HTTP 요청·GraphQL 요청 등 실행 환경에 대한 정보를 담고 있습니다.
// 안 쓰더라도 자리만 차지해야 하니, 관례적으로 _ 또는 _d 처럼 변수명 앞에 언더스코어(_)를 붙입니다.
// 언더스코어는 **"이 변수는 쓰지 않는다"**는 뜻.
// _d는 "unused data" 정도의 의미로 붙인 것.
