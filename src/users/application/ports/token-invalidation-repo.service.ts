import { AuthToken } from "src/users/domain/value-objects/auth-token.vo";

export const TOKEN_INVALIDATION_REPOSITORY = Symbol("TOKEN_INVALIDATION_REPO");

export interface TokenInvalidationRepository {
  invalidateToken(token: AuthToken): Promise<void>;
  invalidateAllUserTokens(userId: string, tokenType?: AuthToken["type"]): Promise<void>;
  verifyTokenValid(token: AuthToken): Promise<boolean>;
}
