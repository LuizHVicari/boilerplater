/*
Test Cases for SignInHandler:

Method Purpose: when receiving email and password, validates credentials and returns tokens
  for authenticated users

  1. **Happy Path**: When receiving valid email and password for an active confirmed user,
    it should verify credentials and return access token and refresh token
  2. **Error**: When receiving an invalid email (user not found), it should throw InvalidCredentialsError
  3. **Error**: When receiving an invalid password, it should throw InvalidCredentialsError
  4. **Error**: When user is inactive or email is not confirmed, it should throw InvalidStateError
*/

import { TestBed } from "@automock/jest";
import { UserModel } from "src/modules/users/domain/models/user.model";
import { InvalidCredentialsError, InvalidStateError } from "src/shared/errors/domain-errors";

import { PASSWORD_SERVICE, PasswordService } from "../../ports/password.service";
import { TOKEN_SERVICE, TokenService } from "../../ports/token.service";
import { USER_QUERY_REPOSITORY, UserQueryRepository } from "../../ports/user-query-repo.service";
import { SignInCommand } from "../sign-in.command";
import { SignInHandler } from "./sign-in.handler";

describe("SignInHandler", () => {
  let handler: SignInHandler;
  let userQueryRepository: jest.Mocked<UserQueryRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(SignInHandler).compile();

    handler = unit;
    userQueryRepository = unitRef.get(USER_QUERY_REPOSITORY);
    passwordService = unitRef.get(PASSWORD_SERVICE);
    tokenService = unitRef.get(TOKEN_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("TC001: Should authenticate user and return tokens when credentials are valid", () => {
    it("should authenticate user and return tokens when credentials are valid", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "validPassword";
      const hashedPassword = "$2b$10$hashedPassword";

      const user = new UserModel({
        id: "user-123",
        email,
        password: hashedPassword,
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: true,
      });

      const mockAccessToken = "access-token-123";
      const mockRefreshToken = "refresh-token-456";

      userQueryRepository.findUserByEmail.mockResolvedValue(user);
      passwordService.verifyPassword.mockResolvedValue(true);
      tokenService.generateToken
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      const command = new SignInCommand(email, password);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual({
        email,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
      expect(userQueryRepository.findUserByEmail).toHaveBeenCalledWith(email);
      expect(passwordService.verifyPassword).toHaveBeenCalledWith(password, hashedPassword);
      expect(tokenService.generateToken).toHaveBeenCalledWith(user, "access");
      expect(tokenService.generateToken).toHaveBeenCalledWith(user, "refresh");
    });
  });

  describe("TC002: Should throw InvalidCredentialsError when receiving an invalid email (user not found)", () => {
    it("should throw InvalidCredentialsError when user is not found", async () => {
      // Arrange
      const email = "nonexistent@example.com";
      const password = "anyPassword";

      userQueryRepository.findUserByEmail.mockResolvedValue(undefined);
      passwordService.verifyPassword.mockResolvedValue(false);

      const command = new SignInCommand(email, password);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(InvalidCredentialsError);
      expect(userQueryRepository.findUserByEmail).toHaveBeenCalledWith(email);
      expect(passwordService.verifyPassword).toHaveBeenCalledWith(
        password,
        "$2b$10$dummyHashForTimingAttackProtection",
      );
      expect(tokenService.generateToken).not.toHaveBeenCalled();
    });
  });

  describe("TC003: Should throw InvalidCredentialsError when receiving an invalid password", () => {
    it("should throw InvalidCredentialsError when password verification fails", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "wrongPassword";
      const hashedPassword = "$2b$10$hashedPassword";

      const user = new UserModel({
        id: "user-123",
        email,
        password: hashedPassword,
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: true,
      });

      userQueryRepository.findUserByEmail.mockResolvedValue(user);
      passwordService.verifyPassword.mockResolvedValue(false);

      const command = new SignInCommand(email, password);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(InvalidCredentialsError);
      expect(userQueryRepository.findUserByEmail).toHaveBeenCalledWith(email);
      expect(passwordService.verifyPassword).toHaveBeenCalledWith(password, hashedPassword);
      expect(tokenService.generateToken).not.toHaveBeenCalled();
    });
  });

  describe("TC004: Should throw InvalidStateError when user is inactive or email is not confirmed", () => {
    it("should throw InvalidStateError when user is inactive", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "validPassword";
      const hashedPassword = "$2b$10$hashedPassword";

      const user = new UserModel({
        id: "user-123",
        email,
        password: hashedPassword,
        firstName: "John",
        lastName: "Doe",
        active: false,
        emailConfirmed: true,
      });

      userQueryRepository.findUserByEmail.mockResolvedValue(user);
      passwordService.verifyPassword.mockResolvedValue(true);

      const command = new SignInCommand(email, password);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(InvalidStateError);
      expect(userQueryRepository.findUserByEmail).toHaveBeenCalledWith(email);
      expect(passwordService.verifyPassword).toHaveBeenCalledWith(password, hashedPassword);
      expect(tokenService.generateToken).not.toHaveBeenCalled();
    });

    it("should throw InvalidStateError when user email is not confirmed", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "validPassword";
      const hashedPassword = "$2b$10$hashedPassword";

      const user = new UserModel({
        id: "user-123",
        email,
        password: hashedPassword,
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: false,
      });

      userQueryRepository.findUserByEmail.mockResolvedValue(user);
      passwordService.verifyPassword.mockResolvedValue(true);

      const command = new SignInCommand(email, password);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(InvalidStateError);
      expect(userQueryRepository.findUserByEmail).toHaveBeenCalledWith(email);
      expect(passwordService.verifyPassword).toHaveBeenCalledWith(password, hashedPassword);
      expect(tokenService.generateToken).not.toHaveBeenCalled();
    });
  });

  describe("TC005: Should mitigate timing attacks", () => {
    it("should always call passwordService.verifyPassword even when user does not exist", async () => {
      // Arrange
      const email = "nonexistent@example.com";
      const password = "anyPassword";

      userQueryRepository.findUserByEmail.mockResolvedValue(undefined);
      passwordService.verifyPassword.mockResolvedValue(false);

      const command = new SignInCommand(email, password);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(InvalidCredentialsError);

      // CRITICAL: This test ensures timing attack protection is not removed
      expect(passwordService.verifyPassword).toHaveBeenCalledWith(
        password,
        "$2b$10$dummyHashForTimingAttackProtection",
      );
      expect(passwordService.verifyPassword).toHaveBeenCalledTimes(1);
    });

    it("should call passwordService.verifyPassword with user hash when user exists", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "validPassword";
      const hashedPassword = "$2b$10$realUserHashedPassword";

      const user = new UserModel({
        id: "user-123",
        email,
        password: hashedPassword,
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: true,
      });

      userQueryRepository.findUserByEmail.mockResolvedValue(user);
      passwordService.verifyPassword.mockResolvedValue(true);
      tokenService.generateToken
        .mockResolvedValueOnce("access-token")
        .mockResolvedValueOnce("refresh-token");

      const command = new SignInCommand(email, password);

      // Act
      await handler.execute(command);

      // Assert
      expect(passwordService.verifyPassword).toHaveBeenCalledWith(password, hashedPassword);
      expect(passwordService.verifyPassword).toHaveBeenCalledTimes(1);
    });
  });
});
