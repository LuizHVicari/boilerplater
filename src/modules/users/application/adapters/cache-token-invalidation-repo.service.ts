import { Injectable, Inject } from "@nestjs/common";
import { TokenInvalidationRepository } from "../ports/token-invalidation-repo.service";
import {
  CACHE_SERVICE,
  type CacheService,
} from "src/modules/common/application/ports/cache.service";
import { AuthToken } from "src/modules/users/domain/value-objects/auth-token.vo";
import { millisecondsToSeconds } from "src/shared/utils/time";
import jwtConfig from "../../config/jwt.config";
import { type ConfigType } from "@nestjs/config";

@Injectable()
export class CacheTokenInvalidationRepoService implements TokenInvalidationRepository {
  constructor(
    @Inject(CACHE_SERVICE) private readonly cacheService: CacheService,
    @Inject(jwtConfig.KEY) private readonly jwtSettings: ConfigType<typeof jwtConfig>,
  ) {}
  async verifyTokenValid(token: AuthToken): Promise<boolean> {
    const [jtiInvalidation, typeInvalidation, allInvalidation] = await Promise.all([
      this.cacheService.get(this.buildSingleTokenInvalidationKey(token)),
      this.cacheService.get<number>(this.buildAllUserTokensInvalidationKey(token.sub, token.type)),
      this.cacheService.get<number>(this.buildAllUserTokensInvalidationKey(token.sub)),
    ]);

    if (jtiInvalidation !== undefined) {
      return false;
    }

    if (typeInvalidation !== undefined && token.iat < typeInvalidation) {
      return false;
    }

    if (allInvalidation !== undefined && token.iat < allInvalidation) {
      return false;
    }

    return true;
  }

  async invalidateToken(token: AuthToken): Promise<void> {
    const invalidationKey = this.buildSingleTokenInvalidationKey(token);
    const ttlSeconds = this.getTokenInvalidationTtl(token.type);
    await this.cacheService.set(invalidationKey, "", ttlSeconds);
  }

  async invalidateAllUserTokens(userId: string, tokenType?: AuthToken["type"]): Promise<void> {
    const invalidationKey = this.buildAllUserTokensInvalidationKey(userId, tokenType);
    const ttlSeconds = this.getTokenInvalidationTtl(tokenType);
    const now = millisecondsToSeconds(Date.now());
    await this.cacheService.set(invalidationKey, now, ttlSeconds);
  }

  private buildSingleTokenInvalidationKey(token: AuthToken): string {
    return `single-token-invalidation:${token.jti}`;
  }

  private buildAllUserTokensInvalidationKey(userId: string, tokenType?: AuthToken["type"]): string {
    return `all-user-tokens-invalidation:${userId}:${tokenType ?? "all"}`;
  }

  private getTokenInvalidationTtl(type?: AuthToken["type"]): number {
    if (type === "access") {
      return this.jwtSettings.accessTokenTtl;
    }
    if (type === "refresh") {
      return this.jwtSettings.refreshTokenTtl;
    }
    if (type === "email-confirmation") {
      return this.jwtSettings.emailVerificationTokenTtl;
    }
    if (type === "password-recovery") {
      return this.jwtSettings.passwordResetTokenTtl;
    }
    return this.jwtSettings.refreshTokenTtl;
  }
}
