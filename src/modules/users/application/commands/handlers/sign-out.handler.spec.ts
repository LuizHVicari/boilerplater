/*
Test Cases for SignOutHandler:

Method Purpose: when receiving access and refresh tokens, invalidates both tokens
  in the blacklist to prevent further use

  1. **Happy Path**: When receiving valid access and refresh tokens,
    it should invalidate both tokens and return success
  2. **Edge Case**: When receiving empty tokens, it should still attempt invalidation
    and return success (idempotent operation)
*/

import { TestBed } from "@automock/jest";
import { AuthToken } from "src/modules/users/domain/value-objects/auth-token.vo";

import { TOKEN_SERVICE, TokenService } from "../../ports/token.service";
import {
  TOKEN_INVALIDATION_REPOSITORY,
  TokenInvalidationRepository,
} from "../../ports/token-invalidation-repo.service";
import { SignOutCommand } from "../sign-out.command";
import { SignOutHandler } from "./sign-out.handler";

describe("SignOutHandler", () => {
  let handler: SignOutHandler;
  let tokenInvalidationRepository: jest.Mocked<TokenInvalidationRepository>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(SignOutHandler).compile();

    handler = unit;
    tokenInvalidationRepository = unitRef.get(TOKEN_INVALIDATION_REPOSITORY);
    tokenService = unitRef.get(TOKEN_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("TC001: Should invalidate both tokens and return success", () => {
    it("should invalidate both tokens and return success", async () => {
      // Arrange
      const accessToken = "access-token-123";
      const refreshToken = "refresh-token-456";

      const mockAccessAuthToken = new AuthToken({
        sub: "user-123",
        iat: 1234567890,
        exp: 1234567990,
        jti: "access-jti-123",
        type: "access",
      });

      const mockRefreshAuthToken = new AuthToken({
        sub: "user-123",
        iat: 1234567890,
        exp: 1234571590,
        jti: "refresh-jti-456",
        type: "refresh",
      });

      tokenService.verifyToken
        .mockResolvedValueOnce(mockAccessAuthToken)
        .mockResolvedValueOnce(mockRefreshAuthToken);

      tokenInvalidationRepository.invalidateToken.mockResolvedValue(undefined);

      const command = new SignOutCommand(accessToken, refreshToken);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual({ success: true });
      expect(tokenService.verifyToken).toHaveBeenCalledWith(accessToken);
      expect(tokenService.verifyToken).toHaveBeenCalledWith(refreshToken);
      expect(tokenInvalidationRepository.invalidateToken).toHaveBeenCalledWith(mockAccessAuthToken);
      expect(tokenInvalidationRepository.invalidateToken).toHaveBeenCalledWith(
        mockRefreshAuthToken,
      );
      expect(tokenInvalidationRepository.invalidateToken).toHaveBeenCalledTimes(2);
    });
  });

  describe("TC002: Should handle empty tokens gracefully", () => {
    it("should attempt invalidation even with empty tokens and return success", async () => {
      // Arrange
      const accessToken = "";
      const refreshToken = "";

      const mockEmptyAccessToken = new AuthToken({
        sub: "",
        iat: 0,
        exp: 0,
        jti: "",
        type: "access",
      });

      const mockEmptyRefreshToken = new AuthToken({
        sub: "",
        iat: 0,
        exp: 0,
        jti: "",
        type: "refresh",
      });

      tokenService.verifyToken
        .mockResolvedValueOnce(mockEmptyAccessToken)
        .mockResolvedValueOnce(mockEmptyRefreshToken);

      tokenInvalidationRepository.invalidateToken.mockResolvedValue(undefined);

      const command = new SignOutCommand(accessToken, refreshToken);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual({ success: true });
      expect(tokenService.verifyToken).toHaveBeenCalledWith(accessToken);
      expect(tokenService.verifyToken).toHaveBeenCalledWith(refreshToken);
      expect(tokenInvalidationRepository.invalidateToken).toHaveBeenCalledWith(
        mockEmptyAccessToken,
      );
      expect(tokenInvalidationRepository.invalidateToken).toHaveBeenCalledWith(
        mockEmptyRefreshToken,
      );
      expect(tokenInvalidationRepository.invalidateToken).toHaveBeenCalledTimes(2);
    });
  });
});
