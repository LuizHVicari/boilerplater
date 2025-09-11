import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import jwtConfig from "../../config/jwt.config";
import { type ConfigType } from "@nestjs/config";
import { AuthToken } from "../../domain/value-objects/auth-token.vo";
import { AuthValidationService } from "../services/auth-validation.service";
import { UserModel } from "../../domain/models/user.model";

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
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY) jwtSettings: ConfigType<typeof jwtConfig>,
    private readonly authValidationService: AuthValidationService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSettings.accessSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<{ user: UserModel; token: AuthToken }> {
    const authToken = new AuthToken(payload);
    const user = await this.authValidationService.validateAuthToken(authToken);

    return { user, token: authToken };
  }
}
