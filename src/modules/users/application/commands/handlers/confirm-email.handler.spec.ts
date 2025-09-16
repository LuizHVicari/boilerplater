/*
Test Cases for ConfirmEmailHandler:

Method Purpose: Confirms user email using email confirmation token

1. **Happy Path**: Should confirm email and return user data when valid token provided
2. **Error**: Should throw Error when token type is not email-confirmation
3. **Error**: Should throw Error when token has been invalidated
4. **Error**: Should throw Error when user not found
5. **Error**: Should throw Error when email already confirmed
6. **Verification**: Should call UnitOfWork.execute with transaction function for data consistency
*/

import { TestBed } from "@automock/jest";
import { UNIT_OF_WORK, type UnitOfWork } from "@common/application/ports/unit-of-work.service";
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
import { ConfirmEmailCommand } from "../confirm-email.command";
import { ConfirmEmailHandler } from "./confirm-email.handler";

describe("ConfirmEmailHandler", () => {
  let confirmEmailHandler: ConfirmEmailHandler;
  let tokenService: jest.Mocked<TokenService>;
  let tokenInvalidationRepo: jest.Mocked<TokenInvalidationRepository>;
  let userQueryRepository: jest.Mocked<UserQueryRepository>;
  let unitOfWork: jest.Mocked<UnitOfWork>;
  let mockRepositoryContext: any;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(ConfirmEmailHandler).compile();

    confirmEmailHandler = unit;
    tokenService = unitRef.get(TOKEN_SERVICE);
    tokenInvalidationRepo = unitRef.get(TOKEN_INVALIDATION_REPOSITORY);
    userQueryRepository = unitRef.get(USER_QUERY_REPOSITORY);
    unitOfWork = unitRef.get(UNIT_OF_WORK);

    // Mock repository context with updateUser method
    mockRepositoryContext = {
      userCommandRepository: {
        updateUser: jest.fn(),
      },
      cancel: jest.fn(),
    };

    // Setup default mocks
    unitOfWork.execute.mockImplementation(async callback => {
      return callback(mockRepositoryContext);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("TC001: Should confirm email and return user data when valid token provided", () => {
    it("should successfully confirm email and return user data", async () => {
      // Arrange
      const token = "valid-email-confirmation-token";
      const command = new ConfirmEmailCommand(token);

      const mockTokenPayload = new AuthToken({
        sub: "user-123",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: "token-jti-123",
        type: "email-confirmation",
      });

      const mockUser = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword",
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: false,
      });

      tokenService.verifyToken.mockResolvedValue(mockTokenPayload);
      tokenInvalidationRepo.verifyTokenValid.mockResolvedValue(true);
      userQueryRepository.findUserById.mockResolvedValue(mockUser);

      // Act
      const result = await confirmEmailHandler.execute(command);

      // Assert
      expect(result).toEqual({
        email: "test@example.com",
        id: "user-123",
      });
      expect(mockUser.emailConfirmed).toBe(true);
    });
  });

  describe("TC002: Should throw Error when token type is not email-confirmation", () => {
    it("should throw error when token type is access", async () => {
      // Arrange
      const token = "invalid-token-type";
      const command = new ConfirmEmailCommand(token);

      const mockTokenPayload = new AuthToken({
        sub: "user-123",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: "token-jti-123",
        type: "access",
      });

      tokenService.verifyToken.mockResolvedValue(mockTokenPayload);

      // Act & Assert
      await expect(confirmEmailHandler.execute(command)).rejects.toThrow("Invalid token");

      // Verify that no subsequent operations occur
      expect(tokenInvalidationRepo.verifyTokenValid).not.toHaveBeenCalled();
      expect(userQueryRepository.findUserById).not.toHaveBeenCalled();
      expect(unitOfWork.execute).not.toHaveBeenCalled();
    });

    it("should throw error when token type is refresh", async () => {
      // Arrange
      const token = "invalid-token-type";
      const command = new ConfirmEmailCommand(token);

      const mockTokenPayload = new AuthToken({
        sub: "user-123",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: "token-jti-123",
        type: "refresh",
      });

      tokenService.verifyToken.mockResolvedValue(mockTokenPayload);

      // Act & Assert
      await expect(confirmEmailHandler.execute(command)).rejects.toThrow("Invalid token");
    });
  });

  describe("TC003: Should throw Error when token has been invalidated", () => {
    it("should throw error when token is invalidated", async () => {
      // Arrange
      const token = "invalidated-token";
      const command = new ConfirmEmailCommand(token);

      const mockTokenPayload = new AuthToken({
        sub: "user-123",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: "token-jti-123",
        type: "email-confirmation",
      });

      tokenService.verifyToken.mockResolvedValue(mockTokenPayload);
      tokenInvalidationRepo.verifyTokenValid.mockResolvedValue(false);

      // Act & Assert
      await expect(confirmEmailHandler.execute(command)).rejects.toThrow(
        "Token has been invalidated",
      );

      // Verify that no subsequent operations occur
      expect(userQueryRepository.findUserById).not.toHaveBeenCalled();
      expect(unitOfWork.execute).not.toHaveBeenCalled();
    });
  });

  describe("TC004: Should throw Error when user not found", () => {
    it("should throw error when user does not exist", async () => {
      // Arrange
      const token = "valid-token-nonexistent-user";
      const command = new ConfirmEmailCommand(token);

      const mockTokenPayload = new AuthToken({
        sub: "nonexistent-user-123",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: "token-jti-123",
        type: "email-confirmation",
      });

      tokenService.verifyToken.mockResolvedValue(mockTokenPayload);
      tokenInvalidationRepo.verifyTokenValid.mockResolvedValue(true);
      userQueryRepository.findUserById.mockResolvedValue(undefined);

      // Act & Assert
      await expect(confirmEmailHandler.execute(command)).rejects.toThrow("Entity not found");

      // Verify that no user update occurs
      expect(unitOfWork.execute).not.toHaveBeenCalled();
    });
  });

  describe("TC005: Should throw Error when email already confirmed", () => {
    it("should throw error when user email is already confirmed", async () => {
      // Arrange
      const token = "valid-token-already-confirmed";
      const command = new ConfirmEmailCommand(token);

      const mockTokenPayload = new AuthToken({
        sub: "user-123",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: "token-jti-123",
        type: "email-confirmation",
      });

      const mockUser = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword",
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: true, // Already confirmed
      });

      tokenService.verifyToken.mockResolvedValue(mockTokenPayload);
      tokenInvalidationRepo.verifyTokenValid.mockResolvedValue(true);
      userQueryRepository.findUserById.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(confirmEmailHandler.execute(command)).rejects.toThrow("Already processed");

      // Verify that no user update occurs
      expect(unitOfWork.execute).not.toHaveBeenCalled();
    });
  });

  describe("TC006: Should call UnitOfWork.execute with transaction function for data consistency", () => {
    it("should execute user update within a transaction", async () => {
      // Arrange
      const token = "valid-email-confirmation-token";
      const command = new ConfirmEmailCommand(token);

      const mockTokenPayload = new AuthToken({
        sub: "user-123",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: "token-jti-123",
        type: "email-confirmation",
      });

      const mockUser = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword",
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: false,
      });

      tokenService.verifyToken.mockResolvedValue(mockTokenPayload);
      tokenInvalidationRepo.verifyTokenValid.mockResolvedValue(true);
      userQueryRepository.findUserById.mockResolvedValue(mockUser);

      // Act
      await confirmEmailHandler.execute(command);

      // Assert
      expect(unitOfWork.execute).toHaveBeenCalledWith(expect.any(Function));
      expect(unitOfWork.execute).toHaveBeenCalledTimes(1);

      // Verify that repository operations are called within the transaction context
      expect(mockRepositoryContext.userCommandRepository.updateUser).toHaveBeenCalledWith(mockUser);
      expect(mockUser.emailConfirmed).toBe(true);
    });
  });
});
