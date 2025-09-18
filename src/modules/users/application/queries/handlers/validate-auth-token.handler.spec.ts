/**
 * Test Cases for ValidateAuthTokenHandler
 *
 * TC001: Should validate auth token and return user and token
 * TC002: Should throw error when auth validation fails
 */

import { TestBed } from "@automock/jest";
import { UserModel } from "@users/domain/models/user.model";
import { AuthToken } from "@users/domain/value-objects/auth-token.vo";

import { AuthValidationService } from "../../services/auth-validation.service";
import { ValidateAuthTokenQuery } from "../validate-auth-token.query";
import { ValidateAuthTokenHandler } from "./validate-auth-token.handler";

describe("ValidateAuthTokenHandler", () => {
  let handler: ValidateAuthTokenHandler;
  let authValidationService: jest.Mocked<AuthValidationService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(ValidateAuthTokenHandler).compile();

    handler = unit;
    authValidationService = unitRef.get(AuthValidationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("TC001: Should validate auth token and return user and token", () => {
    it("should validate auth token and return user and token", async () => {
      // Arrange
      const authToken = new AuthToken({
        sub: "user-123",
        type: "access",
        iat: 1234567890,
        exp: 1234567990,
        jti: "access-jti-123",
      });

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

      authValidationService.validateAuthToken.mockResolvedValue(mockUser);

      const query = new ValidateAuthTokenQuery(authToken);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual({
        user: mockUser,
        token: authToken,
      });
      expect(authValidationService.validateAuthToken).toHaveBeenCalledWith(authToken);
    });
  });

  describe("TC002: Should throw error when auth validation fails", () => {
    it("should throw error when auth validation fails", async () => {
      // Arrange
      const authToken = new AuthToken({
        sub: "user-123",
        type: "access",
        iat: 1234567890,
        exp: 1234567990,
        jti: "access-jti-123",
      });

      const validationError = new Error("User not found");
      authValidationService.validateAuthToken.mockRejectedValue(validationError);

      const query = new ValidateAuthTokenQuery(authToken);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(validationError);
      expect(authValidationService.validateAuthToken).toHaveBeenCalledWith(authToken);
    });
  });
});
