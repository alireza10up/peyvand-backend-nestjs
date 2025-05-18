import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'PEYVAND_SECRET_KEY', // TODO define in env
    });
  }

  validate(
    payload: Record<string, string | number>,
  ): Record<string, string | number> {
    return { userId: payload.sub, email: payload.email };
  }
}
