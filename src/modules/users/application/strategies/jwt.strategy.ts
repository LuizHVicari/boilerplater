import { Inject, Injectable } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import { QueryBus } from "@nestjs/cqrs";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import jwtConfig from "../../config/jwt.config";
import { UserModel } from "../../domain/models/user.model";
import { AuthToken } from "../../domain/value-objects/auth-token.vo";
import { ValidateAuthTokenQuery } from "../queries/validate-auth-token.query";

interface JwtPayload {
  sub: string;
  email: string;
  type: AuthToken["type"];
  iat: number;
  exp: number;
  jti: string;
}
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly queryBus: QueryBus,
    @Inject(jwtConfig.KEY) jwtSettings: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSettings.accessSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<{ user: UserModel; token: AuthToken }> {
    const authToken = new AuthToken(payload);
    const { user } = await this.queryBus.execute(new ValidateAuthTokenQuery(authToken));

    return { user, token: authToken };
  }
}
