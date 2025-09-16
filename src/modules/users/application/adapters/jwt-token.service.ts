import { Inject, Injectable } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InvalidTokenError } from "@shared/errors/domain-errors";
import { millisecondsToSeconds } from "src/shared/utils/time";
import { v4 as uuidv4 } from "uuid";

import jwtConfig from "../../config/jwt.config";
import { UserModel } from "../../domain/models/user.model";
import { AuthToken } from "../../domain/value-objects/auth-token.vo";
import { TokenService } from "../ports/token.service";

interface DecodedJwtPayload {
  sub: string;
  iat: number;
  exp: number;
  jti: string;
  type: AuthToken["type"];
}

@Injectable()
export class JWTTokenService implements TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtSettings: ConfigType<typeof jwtConfig>,
  ) {}

  generateToken(user: UserModel, tokenType: AuthToken["type"]): Promise<string> {
    const iat = Date.now();
    const exp = millisecondsToSeconds(iat) + this.getTokenTTL(tokenType);
    const jti = uuidv4();
    const tokenPayload = new AuthToken({
      sub: user.id,
      iat,
      exp,
      jti,
      type: tokenType,
    });

    const payload = {
      sub: tokenPayload.sub,
      iat: tokenPayload.iat,
      jti: tokenPayload.jti,
      type: tokenPayload.type,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.getTokenSecret(tokenType),
      expiresIn: this.getTokenTTL(tokenType),
    });
  }

  async verifyToken(token: string): Promise<AuthToken> {
    const decoded: DecodedJwtPayload = this.jwtService.decode(token);

    if (!decoded?.type) {
      throw new InvalidTokenError();
    }

    const payload: DecodedJwtPayload = await this.jwtService.verifyAsync(token, {
      secret: this.getTokenSecret(decoded.type),
    });

    return new AuthToken({
      sub: payload.sub,
      iat: payload.iat,
      exp: payload.exp,
      jti: payload.jti,
      type: payload.type,
    });
  }

  private getTokenTTL(tokenType: AuthToken["type"]): number {
    if (tokenType === "access") {
      return this.jwtSettings.accessTokenTtl;
    }
    if (tokenType === "refresh") {
      return this.jwtSettings.refreshTokenTtl;
    }
    if (tokenType === "email-confirmation") {
      return this.jwtSettings.emailVerificationTokenTtl;
    }
    if (tokenType === "password-recovery") {
      return this.jwtSettings.passwordResetTokenTtl;
    }
    throw new InvalidTokenError();
  }

  private getTokenSecret(tokenType: AuthToken["type"]): string {
    if (tokenType === "access") {
      return this.jwtSettings.accessSecret;
    }
    if (tokenType === "refresh") {
      return this.jwtSettings.refreshSecret;
    }
    if (tokenType === "email-confirmation") {
      return this.jwtSettings.emailVerificationSecret;
    }
    if (tokenType === "password-recovery") {
      return this.jwtSettings.passwordResetSecret;
    }
    throw new InvalidTokenError();
  }
}
