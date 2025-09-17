/*
Test Cases for UpdatePasswordHandler:

Method Purpose: when receiving the userId and old password, updates user password with hashed
  password and optionally invalidates previous tokens

  1. **Happy Path**: When receiving a valid userId, old password, new password and invalidateSessions=true,
    it should update the user password with the new one's hash, invalidate all previous tokens and return new tokens
  2. **Happy Path**: When receiving a valid userId, old password, new password and invalidateSessions=false,
    it should update the user password with the new one's hash without invalidating tokens and return new tokens
  3. **Error**: When receiving an invalid userId, it should throw an error
  4. **Error**: When receiving an invalid old password, it should throw an error
  5. **Error**: When user is inactive or email is not confirmed, it should throw an error
*/

import { TestBed } from "@automock/jest";
import {
  RepositoryContext,
  UNIT_OF_WORK,
  UnitOfWork,
} from "src/modules/common/application/ports/unit-of-work.service";
import { UserModel } from "src/modules/users/domain/models/user.model";
import { InvalidCredentialsError, InvalidStateError } from "src/shared/errors/domain-errors";

import { PASSWORD_SERVICE, PasswordService } from "../../ports/password.service";
import { TOKEN_SERVICE, TokenService } from "../../ports/token.service";
import {
  TOKEN_INVALIDATION_REPOSITORY,
  TokenInvalidationRepository,
} from "../../ports/token-invalidation-repo.service";
import { USER_QUERY_REPOSITORY, UserQueryRepository } from "../../ports/user-query-repo.service";
import { UpdatePasswordCommand } from "../update-password.command";
import { UpdatePasswordHandler } from "./update-password.handler";

describe("UpdatePasswordHandler", () => {
  let handler: UpdatePasswordHandler;
  let userQueryRepository: jest.Mocked<UserQueryRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let unitOfWork: jest.Mocked<UnitOfWork>;
  let tokenInvalidationRepo: jest.Mocked<TokenInvalidationRepository>;
  let tokenService: jest.Mocked<TokenService>;
  let mockRepositoryContext: jest.Mocked<Partial<RepositoryContext>>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(UpdatePasswordHandler).compile();

    handler = unit;
    userQueryRepository = unitRef.get(USER_QUERY_REPOSITORY);
    passwordService = unitRef.get(PASSWORD_SERVICE);
    unitOfWork = unitRef.get(UNIT_OF_WORK);
    tokenInvalidationRepo = unitRef.get(TOKEN_INVALIDATION_REPOSITORY);
    tokenService = unitRef.get(TOKEN_SERVICE);

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

  describe("TC001: Should update password and invalidate all previous tokens when invalidateSessions=true", () => {
    it("should update password and invalidate all previous tokens when invalidateSessions=true", async () => {
      // Arrange
      const id = "user-123";
      const oldPassword = "oldPassword";
      const oldPasswordHash = "$2b$10$hashedPassword";
      const newPassword = "newPassword";
      const newPasswordHash = "$2b$10$newPasswordHash";
      const email = "test@example.com";

      const user = new UserModel({
        id,
        email,
        password: oldPasswordHash,
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: true,
      });

      const mockAccessToken = "access-token-123";
      const mockRefreshToken = "refresh-token-456";

      userQueryRepository.findUserById.mockResolvedValue(user);
      passwordService.hashPassword.mockResolvedValue(newPasswordHash);
      passwordService.verifyPassword.mockResolvedValue(true);
      tokenInvalidationRepo.invalidateAllUserTokens.mockResolvedValue(undefined);
      tokenService.generateToken
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      const command = new UpdatePasswordCommand(id, oldPassword, newPassword, true);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual({
        email,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
      expect(userQueryRepository.findUserById).toHaveBeenCalledWith(id);
      expect(passwordService.verifyPassword).toHaveBeenCalledWith(oldPassword, oldPasswordHash);
      expect(passwordService.hashPassword).toHaveBeenCalledWith(newPassword);
      expect(unitOfWork.execute).toHaveBeenCalled();
      expect(tokenInvalidationRepo.invalidateAllUserTokens).toHaveBeenCalledWith(user.id);
      expect(tokenService.generateToken).toHaveBeenCalledWith(user, "access");
      expect(tokenService.generateToken).toHaveBeenCalledWith(user, "refresh");
      expect(mockRepositoryContext.userCommandRepository?.updateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: user.id,
          email: user.email,
          password: newPasswordHash,
        }),
      );
      expect(user.password).not.toEqual(oldPasswordHash);
    });
  });

  describe("TC002: Should update password without invalidating tokens when invalidateSessions=false", () => {
    it("should update password without invalidating tokens when invalidateSessions=false", async () => {
      // Arrange
      const id = "user-123";
      const oldPassword = "oldPassword";
      const oldPasswordHash = "$2b$10$hashedPassword";
      const newPassword = "newPassword";
      const newPasswordHash = "$2b$10$newPasswordHash";
      const email = "test@example.com";

      const user = new UserModel({
        id,
        email,
        password: oldPasswordHash,
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: true,
      });

      const mockAccessToken = "access-token-123";
      const mockRefreshToken = "refresh-token-456";

      userQueryRepository.findUserById.mockResolvedValue(user);
      passwordService.hashPassword.mockResolvedValue(newPasswordHash);
      passwordService.verifyPassword.mockResolvedValue(true);
      tokenService.generateToken
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      const command = new UpdatePasswordCommand(id, oldPassword, newPassword, false);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual({
        email,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
      expect(userQueryRepository.findUserById).toHaveBeenCalledWith(id);
      expect(passwordService.verifyPassword).toHaveBeenCalledWith(oldPassword, oldPasswordHash);
      expect(passwordService.hashPassword).toHaveBeenCalledWith(newPassword);
      expect(unitOfWork.execute).toHaveBeenCalled();
      expect(tokenInvalidationRepo.invalidateAllUserTokens).not.toHaveBeenCalled();
      expect(tokenService.generateToken).toHaveBeenCalledWith(user, "access");
      expect(tokenService.generateToken).toHaveBeenCalledWith(user, "refresh");
      expect(mockRepositoryContext.userCommandRepository?.updateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: user.id,
          email: user.email,
          password: newPasswordHash,
        }),
      );
      expect(user.password).not.toEqual(oldPasswordHash);
    });
  });

  describe("TC003: Should throw error when receiving an invalid userId", () => {
    it("should throw error when user is not found", async () => {
      // Arrange
      const id = "invalid-user-id";
      const oldPassword = "oldPassword";
      const newPassword = "newPassword";

      userQueryRepository.findUserById.mockResolvedValue(undefined);

      const command = new UpdatePasswordCommand(id, oldPassword, newPassword, true);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow("Entity not found");
      expect(userQueryRepository.findUserById).toHaveBeenCalledWith(id);
      expect(passwordService.verifyPassword).not.toHaveBeenCalled();
      expect(passwordService.hashPassword).not.toHaveBeenCalled();
      expect(unitOfWork.execute).not.toHaveBeenCalled();
    });
  });

  describe("TC004: Should throw error when receiving an invalid old password", () => {
    it("should throw error when old password verification fails", async () => {
      // Arrange
      const id = "user-123";
      const oldPassword = "wrongPassword";
      const oldPasswordHash = "$2b$10$hashedPassword";
      const newPassword = "newPassword";
      const email = "test@example.com";

      const user = new UserModel({
        id,
        email,
        password: oldPasswordHash,
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: true,
      });

      userQueryRepository.findUserById.mockResolvedValue(user);
      passwordService.verifyPassword.mockResolvedValue(false);

      const command = new UpdatePasswordCommand(id, oldPassword, newPassword, true);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(InvalidCredentialsError);
      expect(userQueryRepository.findUserById).toHaveBeenCalledWith(id);
      expect(passwordService.verifyPassword).toHaveBeenCalledWith(oldPassword, oldPasswordHash);
      expect(passwordService.hashPassword).not.toHaveBeenCalled();
      expect(unitOfWork.execute).not.toHaveBeenCalled();
    });
  });

  describe("TC005: Should throw error when user is inactive or email is not confirmed", () => {
    it("should throw error when user is inactive", async () => {
      // Arrange
      const id = "user-123";
      const oldPassword = "oldPassword";
      const oldPasswordHash = "$2b$10$hashedPassword";
      const newPassword = "newPassword";
      const email = "test@example.com";

      const user = new UserModel({
        id,
        email,
        password: oldPasswordHash,
        firstName: "John",
        lastName: "Doe",
        active: false,
        emailConfirmed: true,
      });

      userQueryRepository.findUserById.mockResolvedValue(user);

      const command = new UpdatePasswordCommand(id, oldPassword, newPassword, true);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(InvalidStateError);
      expect(userQueryRepository.findUserById).toHaveBeenCalledWith(id);
      expect(passwordService.verifyPassword).not.toHaveBeenCalled();
      expect(passwordService.hashPassword).not.toHaveBeenCalled();
      expect(unitOfWork.execute).not.toHaveBeenCalled();
    });

    it("should throw error when user email is not confirmed", async () => {
      // Arrange
      const id = "user-123";
      const oldPassword = "oldPassword";
      const oldPasswordHash = "$2b$10$hashedPassword";
      const newPassword = "newPassword";
      const email = "test@example.com";

      const user = new UserModel({
        id,
        email,
        password: oldPasswordHash,
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: false,
      });

      userQueryRepository.findUserById.mockResolvedValue(user);

      const command = new UpdatePasswordCommand(id, oldPassword, newPassword, true);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(InvalidStateError);
      expect(userQueryRepository.findUserById).toHaveBeenCalledWith(id);
      expect(passwordService.verifyPassword).not.toHaveBeenCalled();
      expect(passwordService.hashPassword).not.toHaveBeenCalled();
      expect(unitOfWork.execute).not.toHaveBeenCalled();
    });
  });
});
