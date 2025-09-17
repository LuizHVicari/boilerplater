/*
Test cases for ResetPasswordHandler:

Method Purpose: Resets user password using password reset token, received by email

1. **Happy Path**: Should reset password, with hashed password and return the user's email on success and invalidate all of the user previous tokens
2. **Error**: Should not reset password if user is not found
3. **Error**: Should not reset password if token invalidation repository verifies that token has been invalidated
4. **Error**: Should not reset password if token is expired
5. **Error**: Should not reset password if token type is not password-reset
6. **Error**: Should not reset password if user is not active
7. **Error**: Should not reset password if user email is not confirmed
*/

import { TestBed } from "@automock/jest";
import {
  RepositoryContext,
  UNIT_OF_WORK,
  UnitOfWork,
} from "src/modules/common/application/ports/unit-of-work.service";
import { UserNotFoundError } from "src/modules/users/domain/errors/user.errors";
import { UserModel } from "src/modules/users/domain/models/user.model";
import { AuthToken } from "src/modules/users/domain/value-objects/auth-token.vo";
import { InvalidTokenError } from "src/shared/errors/domain-errors";

import { TOKEN_SERVICE, TokenService } from "../../ports/token.service";
import {
  TOKEN_INVALIDATION_REPOSITORY,
  TokenInvalidationRepository,
} from "../../ports/token-invalidation-repo.service";
import { USER_QUERY_REPOSITORY, UserQueryRepository } from "../../ports/user-query-repo.service";
import { ResetPasswordCommand } from "../reset-password.command";
import { ResetPasswordHandler } from "./reset-password.handler";

describe("ResetPasswordHandler", () => {
  let handler: ResetPasswordHandler;
  let userQueryRepo: jest.Mocked<UserQueryRepository>;
  let tokenService: jest.Mocked<TokenService>;
  let unitOfWork: jest.Mocked<UnitOfWork>;
  let tokenInvalidationRepo: jest.Mocked<TokenInvalidationRepository>;
  let mockRepositoryContext: jest.Mocked<Partial<RepositoryContext>>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(ResetPasswordHandler).compile();

    handler = unit;
    userQueryRepo = unitRef.get(USER_QUERY_REPOSITORY);
    tokenService = unitRef.get(TOKEN_SERVICE);
    unitOfWork = unitRef.get(UNIT_OF_WORK);
    tokenInvalidationRepo = unitRef.get(TOKEN_INVALIDATION_REPOSITORY);

    mockRepositoryContext = {
      userCommandRepository: {
        updateUser: jest.fn(),
      } as any,
      cancel: jest.fn(),
    };

    unitOfWork.execute.mockImplementation(async callback => {
      return callback(mockRepositoryContext as any);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("TC001: Should reset password and return the user's email on success", () => {
    it("should reset password and return the user's email on success", async () => {
      // Arrange
      const token = "token-123";
      const id = "user-123";
      const prevPassword = "$2b$10$hashedPassword";
      const newPassword = "newPassword";

      const command = new ResetPasswordCommand(token, newPassword);
      const tokenPayload = new AuthToken({
        sub: id,
        iat: Date.now(),
        exp: Date.now() + 3600,
        jti: "token-123",
        type: "password-recovery",
      });

      const user = new UserModel({
        id,
        email: "test@example.com",
        password: prevPassword,
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: true,
      });

      tokenService.verifyToken.mockResolvedValue(tokenPayload);
      userQueryRepo.findUserById.mockResolvedValue(user);
      tokenInvalidationRepo.verifyTokenValid.mockResolvedValue(true);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual({ email: user.email });
      expect(tokenService.verifyToken).toHaveBeenCalledWith(token);
      expect(userQueryRepo.findUserById).toHaveBeenCalledWith(user.id);
      expect(tokenInvalidationRepo.verifyTokenValid).toHaveBeenCalledWith(tokenPayload);
      expect(mockRepositoryContext.userCommandRepository?.updateUser).toHaveBeenCalledWith(user);
    });
  });

  describe("TC002: Should not reset password if user is not found", () => {
    it("should not reset password if user is not found", async () => {
      // Arrange
      const token = "token-123";
      const command = new ResetPasswordCommand(token, "newPassword");
      const tokenPayload = new AuthToken({
        sub: "user-123",
        iat: Date.now(),
        exp: Date.now() + 3600,
        jti: "token-123",
        type: "password-recovery",
      });

      tokenService.verifyToken.mockResolvedValue(tokenPayload);
      userQueryRepo.findUserById.mockResolvedValue(undefined);
      tokenInvalidationRepo.verifyTokenValid.mockResolvedValue(true);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(UserNotFoundError);
      expect(tokenService.verifyToken).toHaveBeenCalledWith(token);
      expect(userQueryRepo.findUserById).toHaveBeenCalledWith(tokenPayload.sub);
      expect(tokenInvalidationRepo.verifyTokenValid).toHaveBeenCalledWith(tokenPayload);
      expect(mockRepositoryContext.userCommandRepository?.updateUser).not.toHaveBeenCalled();
    });
  });

  describe("TC003: Should not reset password if token invalidation repository verifies that token has been invalidated", () => {
    it("should not reset password if token invalidation repository verifies that token has been invalidated", async () => {
      // Arrange
      const token = "token-123";
      const userId = "user-123";
      const command = new ResetPasswordCommand(token, "newPassword");
      const tokenPayload = new AuthToken({
        sub: userId,
        iat: Date.now(),
        exp: Date.now() + 3600,
        jti: "token-123",
        type: "password-recovery",
      });

      const user = new UserModel({
        id: userId,
        email: "test@example.com",
        password: "$2b$10$hashedPassword",
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: true,
      });

      tokenService.verifyToken.mockResolvedValue(tokenPayload);
      userQueryRepo.findUserById.mockResolvedValue(user);
      tokenInvalidationRepo.verifyTokenValid.mockResolvedValue(false);

      // Act
      await expect(handler.execute(command)).rejects.toThrow(InvalidTokenError);

      // Assert
      expect(tokenService.verifyToken).toHaveBeenCalledWith(token);
      expect(userQueryRepo.findUserById).toHaveBeenCalledWith(tokenPayload.sub);
      expect(tokenInvalidationRepo.verifyTokenValid).toHaveBeenCalledWith(tokenPayload);
      expect(mockRepositoryContext.userCommandRepository?.updateUser).not.toHaveBeenCalled();
    });
  });

  describe("TC004: Should not reset password if token is expired", () => {
    it("should not reset password if token is expired", async () => {
      // Arrange
      const token = "token-123";
      const command = new ResetPasswordCommand(token, "newPassword");

      const expiredError = Object.assign(new Error("jwt expired"), { name: "TokenExpiredError" });

      tokenService.verifyToken.mockRejectedValue(expiredError);

      // Act
      await expect(handler.execute(command)).rejects.toThrow(InvalidTokenError);
      expect(tokenService.verifyToken).toHaveBeenCalledWith(token);
      expect(userQueryRepo.findUserByEmail).not.toHaveBeenCalled();
      expect(tokenInvalidationRepo.verifyTokenValid).not.toHaveBeenCalled();
      expect(mockRepositoryContext.userCommandRepository?.updateUser).not.toHaveBeenCalled();
    });
  });

  describe("TC005: Should not reset password if token type is not password-reset", () => {
    it("should not reset password if token type is access", async () => {
      // Arrange
      const token = "token-123";
      const command = new ResetPasswordCommand(token, "newPassword");
      const invalidAuthToken = new AuthToken({
        sub: "user-123",
        type: "access",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: "jti-123",
      });

      tokenService.verifyToken.mockResolvedValue(invalidAuthToken);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(InvalidTokenError);
      expect(tokenService.verifyToken).toHaveBeenCalledWith(token);
      expect(userQueryRepo.findUserByEmail).not.toHaveBeenCalled();
      expect(tokenInvalidationRepo.verifyTokenValid).not.toHaveBeenCalled();
      expect(mockRepositoryContext.userCommandRepository?.updateUser).not.toHaveBeenCalled();
    });

    it("should not reset password if token type is refresh", async () => {
      // Arrange
      const token = "token-123";
      const command = new ResetPasswordCommand(token, "newPassword");
      const invalidAuthToken = new AuthToken({
        sub: "user-123",
        type: "refresh",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: "jti-123",
      });

      tokenService.verifyToken.mockResolvedValue(invalidAuthToken);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(InvalidTokenError);
      expect(tokenService.verifyToken).toHaveBeenCalledWith(token);
      expect(userQueryRepo.findUserByEmail).not.toHaveBeenCalled();
      expect(tokenInvalidationRepo.verifyTokenValid).not.toHaveBeenCalled();
      expect(mockRepositoryContext.userCommandRepository?.updateUser).not.toHaveBeenCalled();
    });
  });

  describe("TC006: Should not reset password if user is not active", () => {
    it("should not reset password if user is not active", async () => {
      // Arrange
      const token = "token-123";
      const command = new ResetPasswordCommand(token, "newPassword");
      const authToken = new AuthToken({
        sub: "user-123",
        type: "password-recovery",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: "jti-123",
      });
      const inactiveUser = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedpassword123456789012345678901234567890123456789",
        firstName: "John",
        lastName: "Doe",
        active: false, // User is not active
        emailConfirmed: true,
      });

      tokenService.verifyToken.mockResolvedValue(authToken);
      userQueryRepo.findUserByEmail.mockResolvedValue(inactiveUser);
      tokenInvalidationRepo.verifyTokenValid.mockResolvedValue(true);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(UserNotFoundError);
      expect(tokenService.verifyToken).toHaveBeenCalledWith(token);
      expect(userQueryRepo.findUserById).toHaveBeenCalledWith(authToken.sub);
      expect(tokenInvalidationRepo.verifyTokenValid).toHaveBeenCalledWith(authToken);
      expect(mockRepositoryContext.userCommandRepository?.updateUser).not.toHaveBeenCalled();
    });
  });

  describe("TC007: Should not reset password if user email is not confirmed", () => {
    it("should not reset password if user email is not confirmed", async () => {
      // Arrange
      const token = "token-123";
      const command = new ResetPasswordCommand(token, "newPassword");
      const authToken = new AuthToken({
        sub: "user-123",
        type: "password-recovery",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: "jti-123",
      });
      const unconfirmedUser = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedpassword123456789012345678901234567890123456789",
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: false, // Email is not confirmed
      });

      tokenService.verifyToken.mockResolvedValue(authToken);
      userQueryRepo.findUserByEmail.mockResolvedValue(unconfirmedUser);
      tokenInvalidationRepo.verifyTokenValid.mockResolvedValue(true);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(UserNotFoundError);
      expect(tokenService.verifyToken).toHaveBeenCalledWith(token);
      expect(userQueryRepo.findUserById).toHaveBeenCalledWith(authToken.sub);
      expect(tokenInvalidationRepo.verifyTokenValid).toHaveBeenCalledWith(authToken);
      expect(mockRepositoryContext.userCommandRepository?.updateUser).not.toHaveBeenCalled();
    });
  });
});
