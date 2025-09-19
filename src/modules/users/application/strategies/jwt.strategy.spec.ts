/**
 * Test Cases for JwtStrategy
 *
 * TC001: Should validate JWT payload and return user and token
 * TC002: Should throw error when query validation fails
 */

import { TestBed } from "@automock/jest";
import { QueryBus } from "@nestjs/cqrs";
import { UserModel } from "@users/domain/models/user.model";
import { AuthToken } from "@users/domain/value-objects/auth-token.vo";

import jwtConfig from "../../config/jwt.config";
import { ValidateAuthTokenQuery } from "../queries/validate-auth-token.query";
import { JwtStrategy } from "./jwt.strategy";

describe("JwtStrategy", () => {
  let strategy: JwtStrategy;
  let queryBus: jest.Mocked<QueryBus>;

  const mockJwtSettings = {
    accessSecret: "test-access-secret-32-characters",
    refreshSecret: "test-refresh-secret-32-characters",
    emailVerificationSecret: "test-email-secret-32-characters",
    passwordResetSecret: "test-password-secret-32-characters",
    accessTokenTtl: 900,
    refreshTokenTtl: 1296000,
    emailVerificationTokenTtl: 86400,
    passwordResetTokenTtl: 3600,
  };

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(JwtStrategy)
      .mock(jwtConfig.KEY)
      .using(mockJwtSettings)
      .compile();

    strategy = unit;
    queryBus = unitRef.get(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("TC001: Should validate JWT payload and return user and token", () => {
    it("should validate JWT payload and return user and token", async () => {
      // Arrange
      const payload = {
        sub: "user-123",
        email: "user@example.com",
        type: "access" as const,
        iat: 1234567890,
        exp: 1234567990,
        jti: "access-jti-123",
      };

      const mockUser = new UserModel({
        id: "user-123",
        email: "user@example.com",
        password: "$2b$10$hashedPasswordExample123456789",
        firstName: "John",
        lastName: "Doe",
        emailConfirmed: true,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const expectedAuthToken = new AuthToken(payload);

      queryBus.execute.mockResolvedValue({
        user: mockUser,
        token: expectedAuthToken,
      });

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        user: mockUser,
        token: expectedAuthToken,
      });
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(ValidateAuthTokenQuery));

      const calledQuery = queryBus.execute.mock.calls[0][0] as ValidateAuthTokenQuery;
      expect(calledQuery.authToken.sub).toBe(payload.sub);
      expect(calledQuery.authToken.type).toBe(payload.type);
    });
  });

  describe("TC002: Should throw error when query validation fails", () => {
    it("should throw error when query validation fails", async () => {
      // Arrange
      const payload = {
        sub: "user-123",
        email: "user@example.com",
        type: "access" as const,
        iat: 1234567890,
        exp: 1234567990,
        jti: "access-jti-123",
      };

      const validationError = new Error("User not found");
      queryBus.execute.mockRejectedValue(validationError);

      // Act & Assert
      await expect(strategy.validate(payload)).rejects.toThrow(validationError);
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(ValidateAuthTokenQuery));
    });
  });
});
