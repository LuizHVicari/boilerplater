/**
 * Test Cases for RefreshTokenHandler
 *
 * TC001: Should generate new access token when refresh token is valid
 * TC002: Should throw UnauthorizedException when token type is not refresh
 * TC003: Should throw UnauthorizedException when token is blacklisted
 * TC004: Should throw UserNotFoundError when user does not exist
 * TC005: Should throw UnauthorizedException when user cannot authenticate
 */

import { TestBed } from "@automock/jest";
import { UnauthorizedException } from "@nestjs/common";
import { UserNotFoundError } from "@users/domain/errors/user.errors";
import { UserModel } from "@users/domain/models/user.model";
import { AuthToken } from "@users/domain/value-objects/auth-token.vo";

import { TOKEN_SERVICE, type TokenService } from "../../ports/token.service";
import {
  TOKEN_INVALIDATION_REPOSITORY,
  type TokenInvalidationRepository,
} from "../../ports/token-invalidation-repo.service";
import {
  USER_QUERY_REPOSITORY,
  type UserQueryRepository,
} from "../../ports/user-query-repo.service";
import { RefreshTokenCommand } from "../refresh-token.command";
import { RefreshTokenHandler } from "./refresh-token.handler";

describe("RefreshTokenHandler", () => {
  let handler: RefreshTokenHandler;
  let tokenService: jest.Mocked<TokenService>;
  let tokenInvalidationRepository: jest.Mocked<TokenInvalidationRepository>;
  let userQueryRepository: jest.Mocked<UserQueryRepository>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(RefreshTokenHandler).compile();

    handler = unit;
    tokenService = unitRef.get(TOKEN_SERVICE);
    tokenInvalidationRepository = unitRef.get(TOKEN_INVALIDATION_REPOSITORY);
    userQueryRepository = unitRef.get(USER_QUERY_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("TC001: Should generate new access token when refresh token is valid", () => {
    it("should generate new access token when refresh token is valid", async () => {
      // Arrange
      const refreshToken = "valid-refresh-token";
      const userId = "user-123";
      const expectedAccessToken = "new-access-token";

      const mockRefreshAuthToken = new AuthToken({
        sub: userId,
        iat: 1234567890,
        exp: 1234571590,
        jti: "refresh-jti-456",
        type: "refresh",
      });

      const mockUser = new UserModel({
        id: userId,
        email: "user@example.com",
        password: "$2b$10$hashedPasswordExample123456789",
        firstName: "John",
        lastName: "Doe",
        emailConfirmed: true,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      tokenService.verifyToken.mockResolvedValue(mockRefreshAuthToken);
      tokenInvalidationRepository.verifyTokenValid.mockResolvedValue(true);
      userQueryRepository.findUserById.mockResolvedValue(mockUser);
      tokenService.generateToken.mockResolvedValue(expectedAccessToken);

      const command = new RefreshTokenCommand(refreshToken);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual({ accessToken: expectedAccessToken });
      expect(tokenService.verifyToken).toHaveBeenCalledWith(refreshToken);
      expect(tokenInvalidationRepository.verifyTokenValid).toHaveBeenCalledWith(
        mockRefreshAuthToken,
      );
      expect(userQueryRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(tokenService.generateToken).toHaveBeenCalledWith(mockUser, "access");
    });
  });

  describe("TC002: Should throw UnauthorizedException when token type is not refresh", () => {
    it("should throw UnauthorizedException when token type is access", async () => {
      // Arrange
      const refreshToken = "invalid-access-token";

      const mockAccessAuthToken = new AuthToken({
        sub: "user-123",
        iat: 1234567890,
        exp: 1234567990,
        jti: "access-jti-123",
        type: "access",
      });

      tokenService.verifyToken.mockResolvedValue(mockAccessAuthToken);

      const command = new RefreshTokenCommand(refreshToken);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        new UnauthorizedException("Invalid token type for refresh"),
      );
      expect(tokenService.verifyToken).toHaveBeenCalledWith(refreshToken);
    });
  });

  describe("TC003: Should throw UnauthorizedException when token is blacklisted", () => {
    it("should throw UnauthorizedException when token is blacklisted", async () => {
      // Arrange
      const refreshToken = "blacklisted-refresh-token";

      const mockRefreshAuthToken = new AuthToken({
        sub: "user-123",
        iat: 1234567890,
        exp: 1234571590,
        jti: "refresh-jti-456",
        type: "refresh",
      });

      tokenService.verifyToken.mockResolvedValue(mockRefreshAuthToken);
      tokenInvalidationRepository.verifyTokenValid.mockResolvedValue(false);

      const command = new RefreshTokenCommand(refreshToken);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        new UnauthorizedException("Token has been invalidated"),
      );
      expect(tokenService.verifyToken).toHaveBeenCalledWith(refreshToken);
      expect(tokenInvalidationRepository.verifyTokenValid).toHaveBeenCalledWith(
        mockRefreshAuthToken,
      );
    });
  });

  describe("TC004: Should throw UserNotFoundError when user does not exist", () => {
    it("should throw UserNotFoundError when user does not exist", async () => {
      // Arrange
      const refreshToken = "valid-refresh-token";
      const userId = "non-existent-user";

      const mockRefreshAuthToken = new AuthToken({
        sub: userId,
        iat: 1234567890,
        exp: 1234571590,
        jti: "refresh-jti-456",
        type: "refresh",
      });

      tokenService.verifyToken.mockResolvedValue(mockRefreshAuthToken);
      tokenInvalidationRepository.verifyTokenValid.mockResolvedValue(true);
      userQueryRepository.findUserById.mockResolvedValue(undefined);

      const command = new RefreshTokenCommand(refreshToken);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(UserNotFoundError);
      expect(tokenService.verifyToken).toHaveBeenCalledWith(refreshToken);
      expect(tokenInvalidationRepository.verifyTokenValid).toHaveBeenCalledWith(
        mockRefreshAuthToken,
      );
      expect(userQueryRepository.findUserById).toHaveBeenCalledWith(userId);
    });
  });

  describe("TC005: Should throw UnauthorizedException when user cannot authenticate", () => {
    it("should throw UnauthorizedException when user is inactive", async () => {
      // Arrange
      const refreshToken = "valid-refresh-token";
      const userId = "user-123";

      const mockRefreshAuthToken = new AuthToken({
        sub: userId,
        iat: 1234567890,
        exp: 1234571590,
        jti: "refresh-jti-456",
        type: "refresh",
      });

      const mockInactiveUser = new UserModel({
        id: userId,
        email: "user@example.com",
        password: "$2b$10$hashedPasswordExample123456789",
        firstName: "John",
        lastName: "Doe",
        emailConfirmed: true,
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      tokenService.verifyToken.mockResolvedValue(mockRefreshAuthToken);
      tokenInvalidationRepository.verifyTokenValid.mockResolvedValue(true);
      userQueryRepository.findUserById.mockResolvedValue(mockInactiveUser);

      const command = new RefreshTokenCommand(refreshToken);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        new UnauthorizedException("User cannot authenticate"),
      );
      expect(tokenService.verifyToken).toHaveBeenCalledWith(refreshToken);
      expect(tokenInvalidationRepository.verifyTokenValid).toHaveBeenCalledWith(
        mockRefreshAuthToken,
      );
      expect(userQueryRepository.findUserById).toHaveBeenCalledWith(userId);
    });

    it("should throw UnauthorizedException when user email is not confirmed", async () => {
      // Arrange
      const refreshToken = "valid-refresh-token";
      const userId = "user-123";

      const mockRefreshAuthToken = new AuthToken({
        sub: userId,
        iat: 1234567890,
        exp: 1234571590,
        jti: "refresh-jti-456",
        type: "refresh",
      });

      const mockUnconfirmedUser = new UserModel({
        id: userId,
        email: "user@example.com",
        password: "$2b$10$hashedPasswordExample123456789",
        firstName: "John",
        lastName: "Doe",
        emailConfirmed: false,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      tokenService.verifyToken.mockResolvedValue(mockRefreshAuthToken);
      tokenInvalidationRepository.verifyTokenValid.mockResolvedValue(true);
      userQueryRepository.findUserById.mockResolvedValue(mockUnconfirmedUser);

      const command = new RefreshTokenCommand(refreshToken);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        new UnauthorizedException("User cannot authenticate"),
      );
      expect(tokenService.verifyToken).toHaveBeenCalledWith(refreshToken);
      expect(tokenInvalidationRepository.verifyTokenValid).toHaveBeenCalledWith(
        mockRefreshAuthToken,
      );
      expect(userQueryRepository.findUserById).toHaveBeenCalledWith(userId);
    });
  });
});
