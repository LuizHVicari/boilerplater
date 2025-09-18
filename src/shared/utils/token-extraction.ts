import { GraphQLContext } from "../types/http.types";

export interface TokenExtractionResult {
  accessToken: string;
  refreshToken: string;
}

const BEARER_PREFIX_LENGTH = 7;

export function extractTokensFromContext(context: GraphQLContext): TokenExtractionResult {
  const authHeader = context.req.headers.authorization;
  const refreshToken = context.req.cookies?.refreshToken ?? "";

  if (!authHeader || Array.isArray(authHeader)) {
    throw new Error("No authorization token provided");
  }

  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Invalid authorization header format");
  }

  return {
    accessToken: authHeader.substring(BEARER_PREFIX_LENGTH),
    refreshToken,
  };
}

export function clearRefreshTokenCookie(context: GraphQLContext): void {
  context.res.clearCookie("refreshToken");
}
