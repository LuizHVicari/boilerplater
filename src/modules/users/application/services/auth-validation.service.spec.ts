/*
Test Cases for AuthValidationService:
  Method Name: validateAuthToken
    Method Purpose: Validate authentication tokens and return authenticated user

    1. **Happy Path**: Should return user when valid access token and user can authenticate
    2. **Error**: Should throw InvalidCredentialsError when token type is not access
    3. **Error**: Should throw InvalidCredentialsError when user not found by token sub
    4. **Error**: Should throw InvalidCredentialsError when user cannot authenticate (inactive)
    5. **Error**: Should throw InvalidCredentialsError when user cannot authenticate (email not confirmed)
    6. **Error**: Should throw InvalidCredentialsError when user credentials invalidated after token issued
    7. **Error**: Should propagate TokenInvalidationRepository errors
    8. **Verification**: Should call UserQueryRepository.findUserById with token sub
    9. **Verification**: Should call TokenInvalidationRepository.verifyTokenValid with token
    10. **Verification**: Should check token.isValidForAuthentication() before proceeding
    11. **Verification**: Should check user.canAuthenticate() before proceeding
    12. **Integration**: Should validate all steps in correct order
    13. **Edge Case**: Should handle user with no lastCredentialInvalidation date
    14. **Edge Case**: Should handle credentials invalidated exactly at token iat time
*/

import { InvalidCredentialsError } from "src/shared/errors/domain-errors";

import { UserModel } from "../../domain/models/user.model";
import { AuthToken } from "../../domain/value-objects/auth-token.vo";
import { TokenInvalidationRepository } from "../ports/token-invalidation-repo.service";
import { UserQueryRepository } from "../ports/user-query-repo.service";
import { AuthValidationService } from "./auth-validation.service";

jest.mock("../ports/user-query-repo.service");
jest.mock("../ports/token-invalidation-repo.service");

describe("AuthValidationService", () => {
  let authValidationService: AuthValidationService;
  let mockUserQueryRepo: jest.Mocked<UserQueryRepository>;
  let mockTokenInvalidationRepo: jest.Mocked<TokenInvalidationRepository>;

  beforeEach(() => {
    mockUserQueryRepo = {
      findUserById: jest.fn(),
      findUserByEmail: jest.fn(),
      findUsers: jest.fn(),
    } as jest.Mocked<UserQueryRepository>;

    mockTokenInvalidationRepo = {
      verifyTokenValid: jest.fn(),
      invalidateToken: jest.fn(),
      invalidateAllUserTokens: jest.fn(),
    } as jest.Mocked<TokenInvalidationRepository>;

    authValidationService = new AuthValidationService(mockUserQueryRepo, mockTokenInvalidationRepo);
  });

  describe("validateAuthToken", () => {
    it("TC001: Should return user when valid access token and user can authenticate", async () => {
      // Arrange
      const authToken = new AuthToken({
        sub: "user-123",
        iat: 1000000,
        exp: 1000900,
        jti: "jti-123",
        type: "access",
      });

      const user = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: true,
      });

      mockUserQueryRepo.findUserById.mockResolvedValue(user);
      mockTokenInvalidationRepo.verifyTokenValid.mockResolvedValue(true);

      // Act
      const result = await authValidationService.validateAuthToken(authToken);

      // Assert
      expect(result).toBe(user);
      expect(mockUserQueryRepo.findUserById).toHaveBeenCalledWith("user-123");
      expect(mockTokenInvalidationRepo.verifyTokenValid).toHaveBeenCalledWith(authToken);
    });

    it("TC002: Should throw InvalidCredentialsError when token type is not access", async () => {
      // Arrange
      const authToken = new AuthToken({
        sub: "user-123",
        iat: 1000000,
        exp: 1000900,
        jti: "jti-123",
        type: "refresh",
      });

      // Act & Assert
      await expect(authValidationService.validateAuthToken(authToken)).rejects.toThrow(
        InvalidCredentialsError,
      );
      expect(mockUserQueryRepo.findUserById).not.toHaveBeenCalled();
    });

    it("TC003: Should throw InvalidCredentialsError when user not found by token sub", async () => {
      // Arrange
      const authToken = new AuthToken({
        sub: "non-existent-user",
        iat: 1000000,
        exp: 1000900,
        jti: "jti-123",
        type: "access",
      });

      mockUserQueryRepo.findUserById.mockResolvedValue(undefined);

      // Act & Assert
      await expect(authValidationService.validateAuthToken(authToken)).rejects.toThrow(
        InvalidCredentialsError,
      );
      expect(mockUserQueryRepo.findUserById).toHaveBeenCalledWith("non-existent-user");
      expect(mockTokenInvalidationRepo.verifyTokenValid).not.toHaveBeenCalled();
    });

    it("TC004: Should throw InvalidCredentialsError when user cannot authenticate (inactive)", async () => {
      // Arrange
      const authToken = new AuthToken({
        sub: "user-123",
        iat: 1000000,
        exp: 1000900,
        jti: "jti-123",
        type: "access",
      });

      const inactiveUser = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: false, // User is inactive
        emailConfirmed: true,
      });

      mockUserQueryRepo.findUserById.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(authValidationService.validateAuthToken(authToken)).rejects.toThrow(
        InvalidCredentialsError,
      );
      expect(mockUserQueryRepo.findUserById).toHaveBeenCalledWith("user-123");
      expect(mockTokenInvalidationRepo.verifyTokenValid).not.toHaveBeenCalled();
    });

    it("TC005: Should throw InvalidCredentialsError when user cannot authenticate (email not confirmed)", async () => {
      // Arrange
      const authToken = new AuthToken({
        sub: "user-123",
        iat: 1000000,
        exp: 1000900,
        jti: "jti-123",
        type: "access",
      });

      const unconfirmedUser = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: false, // Email not confirmed
      });

      mockUserQueryRepo.findUserById.mockResolvedValue(unconfirmedUser);

      // Act & Assert
      await expect(authValidationService.validateAuthToken(authToken)).rejects.toThrow(
        InvalidCredentialsError,
      );
      expect(mockUserQueryRepo.findUserById).toHaveBeenCalledWith("user-123");
      expect(mockTokenInvalidationRepo.verifyTokenValid).not.toHaveBeenCalled();
    });

    it("TC006: Should throw InvalidCredentialsError when user credentials invalidated after token issued", async () => {
      // Arrange
      const authToken = new AuthToken({
        sub: "user-123",
        iat: 1000000, // Token issued at this time
        exp: 1000900,
        jti: "jti-123",
        type: "access",
      });

      const user = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: true,
        lastCredentialInvalidation: new Date(1000100 * 1000), // Invalidated after token was issued
      });

      mockUserQueryRepo.findUserById.mockResolvedValue(user);

      // Act & Assert
      await expect(authValidationService.validateAuthToken(authToken)).rejects.toThrow(
        InvalidCredentialsError,
      );
      expect(mockUserQueryRepo.findUserById).toHaveBeenCalledWith("user-123");
      expect(mockTokenInvalidationRepo.verifyTokenValid).not.toHaveBeenCalled();
    });

    it("TC007: Should propagate TokenInvalidationRepository errors", async () => {
      // Arrange
      const authToken = new AuthToken({
        sub: "user-123",
        iat: 1000000,
        exp: 1000900,
        jti: "jti-123",
        type: "access",
      });

      const user = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: true,
      });

      mockUserQueryRepo.findUserById.mockResolvedValue(user);
      mockTokenInvalidationRepo.verifyTokenValid.mockRejectedValue(new Error("Token blacklisted"));

      // Act & Assert
      await expect(authValidationService.validateAuthToken(authToken)).rejects.toThrow(
        "Token blacklisted",
      );
      expect(mockTokenInvalidationRepo.verifyTokenValid).toHaveBeenCalledWith(authToken);
    });

    it("TC008: Should call UserQueryRepository.findUserById with token sub", async () => {
      // Arrange
      const authToken = new AuthToken({
        sub: "specific-user-id",
        iat: 1000000,
        exp: 1000900,
        jti: "jti-123",
        type: "access",
      });

      const user = new UserModel({
        id: "specific-user-id",
        email: "test@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: true,
      });

      mockUserQueryRepo.findUserById.mockResolvedValue(user);
      mockTokenInvalidationRepo.verifyTokenValid.mockResolvedValue(true);

      // Act
      await authValidationService.validateAuthToken(authToken);

      // Assert
      expect(mockUserQueryRepo.findUserById).toHaveBeenCalledTimes(1);
      expect(mockUserQueryRepo.findUserById).toHaveBeenCalledWith("specific-user-id");
    });

    it("TC009: Should call TokenInvalidationRepository.verifyTokenValid with token", async () => {
      // Arrange
      const authToken = new AuthToken({
        sub: "user-123",
        iat: 1000000,
        exp: 1000900,
        jti: "jti-123",
        type: "access",
      });

      const user = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: true,
      });

      mockUserQueryRepo.findUserById.mockResolvedValue(user);
      mockTokenInvalidationRepo.verifyTokenValid.mockResolvedValue(true);

      // Act
      await authValidationService.validateAuthToken(authToken);

      // Assert
      expect(mockTokenInvalidationRepo.verifyTokenValid).toHaveBeenCalledTimes(1);
      expect(mockTokenInvalidationRepo.verifyTokenValid).toHaveBeenCalledWith(authToken);
    });

    it("TC010: Should check token.isValidForAuthentication() before proceeding", async () => {
      // Arrange
      const emailToken = new AuthToken({
        sub: "user-123",
        iat: 1000000,
        exp: 1000900,
        jti: "jti-123",
        type: "email-confirmation", // Not valid for authentication
      });

      // Act & Assert
      await expect(authValidationService.validateAuthToken(emailToken)).rejects.toThrow(
        InvalidCredentialsError,
      );
      // Should not proceed to user lookup
      expect(mockUserQueryRepo.findUserById).not.toHaveBeenCalled();
    });

    it("TC011: Should check user.canAuthenticate() before proceeding", async () => {
      // Arrange
      const authToken = new AuthToken({
        sub: "user-123",
        iat: 1000000,
        exp: 1000900,
        jti: "jti-123",
        type: "access",
      });

      const userCannotAuth = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: false, // Cannot authenticate
        emailConfirmed: false,
      });

      mockUserQueryRepo.findUserById.mockResolvedValue(userCannotAuth);

      // Act & Assert
      await expect(authValidationService.validateAuthToken(authToken)).rejects.toThrow(
        InvalidCredentialsError,
      );
      // Should not proceed to token invalidation check
      expect(mockTokenInvalidationRepo.verifyTokenValid).not.toHaveBeenCalled();
    });

    it("TC012: Should validate all steps in correct order", async () => {
      // Arrange
      const authToken = new AuthToken({
        sub: "user-123",
        iat: 1000000,
        exp: 1000900,
        jti: "jti-123",
        type: "access",
      });

      const user = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: true,
      });

      mockUserQueryRepo.findUserById.mockResolvedValue(user);
      mockTokenInvalidationRepo.verifyTokenValid.mockResolvedValue(true);

      // Act
      const result = await authValidationService.validateAuthToken(authToken);

      // Assert - Verify order of calls
      const calls = [
        mockUserQueryRepo.findUserById.mock.invocationCallOrder[0],
        mockTokenInvalidationRepo.verifyTokenValid.mock.invocationCallOrder[0],
      ];
      expect(calls[0]).toBeLessThan(calls[1]); // User lookup should happen before token validation
      expect(result).toBe(user);
    });

    it("TC013: Should handle user with no lastCredentialInvalidation date", async () => {
      // Arrange
      const authToken = new AuthToken({
        sub: "user-123",
        iat: 1000000,
        exp: 1000900,
        jti: "jti-123",
        type: "access",
      });

      const user = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: true,
        // No lastCredentialInvalidation provided
      });

      mockUserQueryRepo.findUserById.mockResolvedValue(user);
      mockTokenInvalidationRepo.verifyTokenValid.mockResolvedValue(true);

      // Act
      const result = await authValidationService.validateAuthToken(authToken);

      // Assert
      expect(result).toBe(user);
      expect(mockTokenInvalidationRepo.verifyTokenValid).toHaveBeenCalledWith(authToken);
    });

    it("TC014: Should handle credentials invalidated exactly at token iat time", async () => {
      // Arrange
      const tokenIat = 1000000;
      const authToken = new AuthToken({
        sub: "user-123",
        iat: tokenIat,
        exp: 1000900,
        jti: "jti-123",
        type: "access",
      });

      const user = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: true,
        lastCredentialInvalidation: new Date(tokenIat * 1000), // Invalidated at exact same time
      });

      mockUserQueryRepo.findUserById.mockResolvedValue(user);
      mockTokenInvalidationRepo.verifyTokenValid.mockResolvedValue(true);

      // Act
      const result = await authValidationService.validateAuthToken(authToken);

      // Assert - Should succeed because invalidation is not > token iat
      expect(result).toBe(user);
      expect(mockTokenInvalidationRepo.verifyTokenValid).toHaveBeenCalledWith(authToken);
    });
  });
});
