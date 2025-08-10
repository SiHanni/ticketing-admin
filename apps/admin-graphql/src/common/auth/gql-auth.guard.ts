// 목적/경로: ADMIN 전용 접근 보호 (JWT 검증 + roles=admin)
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  private readonly secret = process.env.ADMIN_JWT_SECRET || 'admin-secret';
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext) {
    const gqlCtx = ctx.getArgByIndex(2);
    const token = gqlCtx?.token;
    if (!token) throw new UnauthorizedException('Missing token');

    try {
      const payload = new JwtService().verify(token, { secret: this.secret });
      gqlCtx.user = payload;
      if (!payload?.roles?.includes('admin'))
        throw new ForbiddenException('Admins only');
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
