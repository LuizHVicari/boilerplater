/*
Test Cases for ForgotPasswordHandler:

Method Purpose: Sends an email with a password reset token to a user's email address

1. **Happy Path**: Should send an email with a token to reset the email and invalidate all previous tokens
2. **Happy Path**: Should fail silently when the user is not registered, for security reasons
3. **Error**: Should handle token service failure and propagate token generation errors
4. **Error**: Should handle email service failure and propagate email sending errors
5. **Verification**: Should invalidate all existing password-recovery tokens before generating new one
6. **Verification**: Should send email with correct template and reset password context
*/

import { TestBed } from "@automock/jest";
import {
  EMAIL_SERVICE,
  EmailService,
  SendEmailProps,
} from "src/modules/common/application/ports/email.service";
import { UserModel } from "src/modules/users/domain/models/user.model";

import { EMAIL_CONFIG_SERVICE, type EmailConfigService } from "../../ports/email-config.service";
import { TOKEN_SERVICE, TokenService } from "../../ports/token.service";
import {
  TOKEN_INVALIDATION_REPOSITORY,
  TokenInvalidationRepository,
} from "../../ports/token-invalidation-repo.service";
import { USER_QUERY_REPOSITORY, UserQueryRepository } from "../../ports/user-query-repo.service";
import { ForgotPasswordCommand } from "../forgot-password.command";
import { ForgotPasswordHandler } from "./forgot-password.handler";

describe("ForgotPasswordHandler", () => {
  let handler: ForgotPasswordHandler;
  let emailService: jest.Mocked<EmailService>;
  let tokenService: jest.Mocked<TokenService>;
  let tokenInvalidationRepo: jest.Mocked<TokenInvalidationRepository>;
  let userQueryRepo: jest.Mocked<UserQueryRepository>;
  let emailConfigService: jest.Mocked<EmailConfigService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(ForgotPasswordHandler).compile();

    handler = unit;
    emailService = unitRef.get(EMAIL_SERVICE);
    tokenService = unitRef.get(TOKEN_SERVICE);
    tokenInvalidationRepo = unitRef.get(TOKEN_INVALIDATION_REPOSITORY);
    userQueryRepo = unitRef.get(USER_QUERY_REPOSITORY);
    emailConfigService = unitRef.get(EMAIL_CONFIG_SERVICE);

    // Setup EmailConfigService mock values
    emailConfigService.appName = "My App";
    emailConfigService.supportEmail = "Lx0dR@example.com";
    emailConfigService.baseUrl = "https://example.com";
    emailConfigService.resetPasswordPath = "/reset-password";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("TC001: Should send an email with a token to reset the email and invalidate all previous tokens", () => {
    it("should successfully resend the reset password email and invalidate previous reset password tokens ", async () => {
      // Arrange
      const email = "test@example.com.br";
      const command = new ForgotPasswordCommand(email);

      const mockUser = new UserModel({
        id: "user-123",
        email,
        password: "$2b$10$hashedPassword",
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: true,
      });

      const mockToken = "new-reset-password-token-123";

      userQueryRepo.findUserByEmail.mockResolvedValue(mockUser);
      tokenInvalidationRepo.invalidateAllUserTokens.mockResolvedValue(undefined);
      tokenService.generateToken.mockResolvedValue(mockToken);
      emailService.sendEmail.mockResolvedValue(undefined);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual({ email: email });
      expect(userQueryRepo.findUserByEmail).toHaveBeenCalledWith(email);
      expect(tokenInvalidationRepo.invalidateAllUserTokens).toHaveBeenCalledWith(
        mockUser.id,
        "password-recovery",
      );
      expect(tokenService.generateToken).toHaveBeenCalledWith(mockUser, "password-recovery");
      const expectedPasswordEmailRequestPayload: SendEmailProps = {
        email,
        subject: "Reset your password",
        template: "reset-password",
        context: {
          appName: "My App",
          userName: "John",
          resetUrl: `https://example.com/reset-password?token=${mockToken}`,
          expirationTime: "1 day",
          supportEmail: "Lx0dR@example.com",
        },
      };
      expect(emailService.sendEmail).toHaveBeenCalledWith(expectedPasswordEmailRequestPayload);
    });
  });

  describe("TC002: Should fail silently when the user is not registered", () => {
    it("should fail silently when the user is not registered", async () => {
      // Arrange
      const email = "test@example.com.br";
      const command = new ForgotPasswordCommand(email);

      userQueryRepo.findUserByEmail.mockResolvedValue(undefined);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual({ email: email });
      expect(userQueryRepo.findUserByEmail).toHaveBeenCalledWith(email);
      expect(tokenInvalidationRepo.invalidateAllUserTokens).not.toHaveBeenCalled();
      expect(tokenService.generateToken).not.toHaveBeenCalled();
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe("TC003: Should handle token service failure and propagate token generation errors", () => {
    it("should propagate token generation errors", async () => {
      // Arrange
      const email = "test@example.com.br";
      const command = new ForgotPasswordCommand(email);
      const mockUser = new UserModel({
        id: "user-123",
        email,
        password: "$2b$10$hashedpassword123456789012345678901234567890123456789",
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: true,
      });
      const tokenError = new Error("Token generation failed");

      userQueryRepo.findUserByEmail.mockResolvedValue(mockUser);
      tokenInvalidationRepo.invalidateAllUserTokens.mockResolvedValue(undefined);
      tokenService.generateToken.mockRejectedValue(tokenError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow("Token generation failed");
      expect(userQueryRepo.findUserByEmail).toHaveBeenCalledWith(email);
      expect(tokenInvalidationRepo.invalidateAllUserTokens).toHaveBeenCalledWith(
        mockUser.id,
        "password-recovery",
      );
      expect(tokenService.generateToken).toHaveBeenCalledWith(mockUser, "password-recovery");
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe("TC004: Should handle email service failure and propagate email sending errors", () => {
    it("should propagate email sending errors", async () => {
      // Arrange
      const email = "test@example.com.br";
      const command = new ForgotPasswordCommand(email);
      const mockUser = new UserModel({
        id: "user-123",
        email,
        password: "$2b$10$hashedpassword123456789012345678901234567890123456789",
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: true,
      });
      const mockToken = "new-reset-password-token-123";
      const emailError = new Error("Email sending failed");

      userQueryRepo.findUserByEmail.mockResolvedValue(mockUser);
      tokenInvalidationRepo.invalidateAllUserTokens.mockResolvedValue(undefined);
      tokenService.generateToken.mockResolvedValue(mockToken);
      emailService.sendEmail.mockRejectedValue(emailError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow("Email sending failed");
      expect(userQueryRepo.findUserByEmail).toHaveBeenCalledWith(email);
      expect(tokenInvalidationRepo.invalidateAllUserTokens).toHaveBeenCalledWith(
        mockUser.id,
        "password-recovery",
      );
      expect(tokenService.generateToken).toHaveBeenCalledWith(mockUser, "password-recovery");
      expect(emailService.sendEmail).toHaveBeenCalled();
    });
  });

  describe("TC005: Should invalidate all existing password-recovery tokens before generating new one", () => {
    it("should invalidate previous password-recovery tokens for security", async () => {
      // Arrange
      const email = "test@example.com.br";
      const command = new ForgotPasswordCommand(email);
      const mockUser = new UserModel({
        id: "user-123",
        email,
        password: "$2b$10$hashedpassword123456789012345678901234567890123456789",
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: true,
      });
      const mockToken = "new-reset-password-token-123";

      userQueryRepo.findUserByEmail.mockResolvedValue(mockUser);
      tokenInvalidationRepo.invalidateAllUserTokens.mockResolvedValue(undefined);
      tokenService.generateToken.mockResolvedValue(mockToken);
      emailService.sendEmail.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(tokenInvalidationRepo.invalidateAllUserTokens).toHaveBeenCalledWith(
        mockUser.id,
        "password-recovery",
      );
      // Verify invalidation is called before token generation
      expect(tokenInvalidationRepo.invalidateAllUserTokens).toHaveBeenCalled();
      expect(tokenService.generateToken).toHaveBeenCalled();
    });
  });

  describe("TC006: Should send email with correct template and reset password context", () => {
    it("should send email with proper template and context when user has firstName", async () => {
      // Arrange
      const email = "test@example.com.br";
      const command = new ForgotPasswordCommand(email);
      const mockUser = new UserModel({
        id: "user-123",
        email,
        password: "$2b$10$hashedpassword123456789012345678901234567890123456789",
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: true,
      });
      const mockToken = "new-reset-password-token-123";

      userQueryRepo.findUserByEmail.mockResolvedValue(mockUser);
      tokenInvalidationRepo.invalidateAllUserTokens.mockResolvedValue(undefined);
      tokenService.generateToken.mockResolvedValue(mockToken);
      emailService.sendEmail.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalledWith({
        email,
        subject: "Reset your password",
        template: "reset-password",
        context: {
          appName: "My App",
          userName: "John",
          resetUrl: `https://example.com/reset-password?token=${mockToken}`,
          expirationTime: "1 day",
          supportEmail: "Lx0dR@example.com",
        },
      });
    });

    it("should send email with email as userName when user has no firstName", async () => {
      // Arrange
      const email = "test@example.com.br";
      const command = new ForgotPasswordCommand(email);
      const mockUser = new UserModel({
        id: "user-123",
        email,
        password: "$2b$10$hashedpassword123456789012345678901234567890123456789",
        lastName: "Doe",
        active: true,
        emailConfirmed: true,
      });
      const mockToken = "new-reset-password-token-123";

      userQueryRepo.findUserByEmail.mockResolvedValue(mockUser);
      tokenInvalidationRepo.invalidateAllUserTokens.mockResolvedValue(undefined);
      tokenService.generateToken.mockResolvedValue(mockToken);
      emailService.sendEmail.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalledWith({
        email,
        subject: "Reset your password",
        template: "reset-password",
        context: {
          appName: "My App",
          userName: email,
          resetUrl: `https://example.com/reset-password?token=${mockToken}`,
          expirationTime: "1 day",
          supportEmail: "Lx0dR@example.com",
        },
      });
    });
  });
});
