import { Injectable } from "@nestjs/common";
import { TokenInvalidationRepository } from "../ports/token-invalidation-repo.service";
import { type CacheService } from "src/common/application/ports/cache.service";
import {
  ONE_DAY_SECONDS,
  TWO_WEEKS_SECONDS,
  ONE_HOUR_SECONDS,
} from "src/shared/constants/time-units.constants";
import { AuthToken } from "src/users/domain/value-objects/auth-token.vo";
import { millisecondsToSeconds } from "src/shared/utils/time";

const EMAIL_VERIFICATION_TOKEN_TTL_SECONDS = ONE_DAY_SECONDS;
const RESET_PASSWORD_TOKEN_TTL_SECONDS = ONE_DAY_SECONDS;
const REFRESH_TOKEN_TTL_SECONDS = TWO_WEEKS_SECONDS;
const ACCESS_TOKEN_TTL_SECONDS = ONE_HOUR_SECONDS;

@Injectable()
export class CacheTokenInvalidationRepoService implements TokenInvalidationRepository {
  constructor(private readonly cacheService: CacheService) {}
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
      return ACCESS_TOKEN_TTL_SECONDS;
    }
    if (type === "refresh") {
      return REFRESH_TOKEN_TTL_SECONDS;
    }
    if (type === "email-confirmation") {
      return EMAIL_VERIFICATION_TOKEN_TTL_SECONDS;
    }
    if (type === "password-recovery") {
      return RESET_PASSWORD_TOKEN_TTL_SECONDS;
    }
    return TWO_WEEKS_SECONDS;
  }
}
