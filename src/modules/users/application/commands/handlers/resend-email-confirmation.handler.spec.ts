/*
Test Cases for ResendEmailConfirmationHandler:

Method Purpose: Resends email confirmation token to users who have not yet confirmed their email

1. **Happy Path**: Should invalidate old tokens, generate new token, and send email when valid unconfirmed user email provided
2. **Error**: Should throw UserNotFoundError when user email does not exist
3. **Error**: Should throw EmailAlreadyConfirmedError when user email is already confirmed
4. **Verification**: Should invalidate all existing email-confirmation tokens before generating new one
5. **Verification**: Should send email with correct template and verification context
6. **Error**: Should handle token service failure and propagate token generation errors
7. **Error**: Should handle email service failure and propagate email sending errors
*/

import { TestBed } from "@automock/jest";
import { EMAIL_SERVICE, type EmailService } from "@common/application/ports/email.service";
import { UserModel } from "@users/domain/models/user.model";
import {
  EmailAlreadyConfirmedError,
  UserNotFoundError,
} from "src/modules/users/domain/errors/user-errors";

import { TOKEN_SERVICE, type TokenService } from "../../ports/token.service";
import {
  TOKEN_INVALIDATION_REPOSITORY,
  type TokenInvalidationRepository,
} from "../../ports/token-invalidation-repo.service";
import {
  USER_QUERY_REPOSITORY,
  type UserQueryRepository,
} from "../../ports/user-query-repo.service";
import { ResendEmailConfirmationCommand } from "../resend-email-confirmation.command";
import { ResendEmailConfirmationHandler } from "./resend-email-confirmation.handler";

describe("ResendEmailConfirmationHandler", () => {
  let resendEmailConfirmationHandler: ResendEmailConfirmationHandler;
  let userQueryRepository: jest.Mocked<UserQueryRepository>;
  let emailService: jest.Mocked<EmailService>;
  let tokenInvalidationRepo: jest.Mocked<TokenInvalidationRepository>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(ResendEmailConfirmationHandler).compile();

    resendEmailConfirmationHandler = unit;
    userQueryRepository = unitRef.get(USER_QUERY_REPOSITORY);
    emailService = unitRef.get(EMAIL_SERVICE);
    tokenInvalidationRepo = unitRef.get(TOKEN_INVALIDATION_REPOSITORY);
    tokenService = unitRef.get(TOKEN_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("TC001: Should invalidate old tokens, generate new token, and send email when valid unconfirmed user email provided", () => {
    it("should successfully resend email confirmation and return user email", async () => {
      // Arrange
      const command = new ResendEmailConfirmationCommand("test@example.com");

      const mockUser = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword",
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: false,
      });

      const mockToken = "new-confirmation-token-123";

      userQueryRepository.findUserByEmail.mockResolvedValue(mockUser);
      tokenInvalidationRepo.invalidateAllUserTokens.mockResolvedValue(undefined);
      tokenService.generateToken.mockResolvedValue(mockToken);
      emailService.sendEmail.mockResolvedValue(undefined);

      // Act
      const result = await resendEmailConfirmationHandler.execute(command);

      // Assert
      expect(result).toEqual({ email: "test@example.com" });
      expect(userQueryRepository.findUserByEmail).toHaveBeenCalledWith("test@example.com");
      expect(tokenInvalidationRepo.invalidateAllUserTokens).toHaveBeenCalledWith(
        "user-123",
        "email-confirmation",
      );
      expect(tokenService.generateToken).toHaveBeenCalledWith(mockUser, "email-confirmation");
      expect(emailService.sendEmail).toHaveBeenCalledWith({
        email: "test@example.com",
        subject: "Welcome to our platform",
        template: "email-verification",
        context: {
          appName: "My App",
          userName: "John",
          verificationUrl: `https://example.com/verify?token=${mockToken}`,
          expirationTime: "1 day",
          supportEmail: "Lx0dR@example.com",
        },
      });
    });
  });

  describe("TC002: Should throw UserNotFoundError when user email does not exist", () => {
    it("should throw UserNotFoundError when user is not found", async () => {
      // Arrange
      const command = new ResendEmailConfirmationCommand("nonexistent@example.com");

      userQueryRepository.findUserByEmail.mockResolvedValue(undefined);

      // Act & Assert
      await expect(resendEmailConfirmationHandler.execute(command)).rejects.toThrow(
        UserNotFoundError,
      );

      // Verify that no subsequent operations occur
      expect(tokenInvalidationRepo.invalidateAllUserTokens).not.toHaveBeenCalled();
      expect(tokenService.generateToken).not.toHaveBeenCalled();
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe("TC003: Should throw EmailAlreadyConfirmedError when user email is already confirmed", () => {
    it("should throw EmailAlreadyConfirmedError when user email is already confirmed", async () => {
      // Arrange
      const command = new ResendEmailConfirmationCommand("confirmed@example.com");

      const mockUser = new UserModel({
        id: "user-123",
        email: "confirmed@example.com",
        password: "$2b$10$hashedPassword",
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: true, // Already confirmed
      });

      userQueryRepository.findUserByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(resendEmailConfirmationHandler.execute(command)).rejects.toThrow(
        EmailAlreadyConfirmedError,
      );

      // Verify that no subsequent operations occur
      expect(tokenInvalidationRepo.invalidateAllUserTokens).not.toHaveBeenCalled();
      expect(tokenService.generateToken).not.toHaveBeenCalled();
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe("TC004: Should invalidate all existing email-confirmation tokens before generating new one", () => {
    it("should invalidate previous email-confirmation tokens for security", async () => {
      // Arrange
      const command = new ResendEmailConfirmationCommand("test@example.com");

      const mockUser = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword",
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: false,
      });

      const mockToken = "new-confirmation-token-123";

      userQueryRepository.findUserByEmail.mockResolvedValue(mockUser);
      tokenInvalidationRepo.invalidateAllUserTokens.mockResolvedValue(undefined);
      tokenService.generateToken.mockResolvedValue(mockToken);
      emailService.sendEmail.mockResolvedValue(undefined);

      // Act
      await resendEmailConfirmationHandler.execute(command);

      // Assert
      expect(tokenInvalidationRepo.invalidateAllUserTokens).toHaveBeenCalledWith(
        "user-123",
        "email-confirmation",
      );
      expect(tokenService.generateToken).toHaveBeenCalledWith(mockUser, "email-confirmation");

      // Verify order: token invalidation should happen before token generation
      const invalidateCall =
        tokenInvalidationRepo.invalidateAllUserTokens.mock.invocationCallOrder[0];
      const generateCall = tokenService.generateToken.mock.invocationCallOrder[0];
      expect(invalidateCall).toBeLessThan(generateCall);
    });
  });

  describe("TC005: Should send email with correct template and verification context", () => {
    it("should send email with proper template and context when user has firstName", async () => {
      // Arrange
      const command = new ResendEmailConfirmationCommand("test@example.com");

      const mockUser = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword",
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: false,
      });

      const mockToken = "new-confirmation-token-123";

      userQueryRepository.findUserByEmail.mockResolvedValue(mockUser);
      tokenInvalidationRepo.invalidateAllUserTokens.mockResolvedValue(undefined);
      tokenService.generateToken.mockResolvedValue(mockToken);
      emailService.sendEmail.mockResolvedValue(undefined);

      // Act
      await resendEmailConfirmationHandler.execute(command);

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalledWith({
        email: "test@example.com",
        subject: "Welcome to our platform",
        template: "email-verification",
        context: {
          appName: "My App",
          userName: "John",
          verificationUrl: `https://example.com/verify?token=${mockToken}`,
          expirationTime: "1 day",
          supportEmail: "Lx0dR@example.com",
        },
      });
    });

    it("should send email with email as userName when user has no firstName", async () => {
      // Arrange
      const command = new ResendEmailConfirmationCommand("test@example.com");

      const mockUser = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword",
        firstName: undefined,
        lastName: "Doe",
        active: true,
        emailConfirmed: false,
      });

      const mockToken = "new-confirmation-token-123";

      userQueryRepository.findUserByEmail.mockResolvedValue(mockUser);
      tokenInvalidationRepo.invalidateAllUserTokens.mockResolvedValue(undefined);
      tokenService.generateToken.mockResolvedValue(mockToken);
      emailService.sendEmail.mockResolvedValue(undefined);

      // Act
      await resendEmailConfirmationHandler.execute(command);

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalledWith({
        email: "test@example.com",
        subject: "Welcome to our platform",
        template: "email-verification",
        context: {
          appName: "My App",
          userName: "test@example.com",
          verificationUrl: `https://example.com/verify?token=${mockToken}`,
          expirationTime: "1 day",
          supportEmail: "Lx0dR@example.com",
        },
      });
    });
  });

  describe("TC006: Should handle token service failure and propagate token generation errors", () => {
    it("should propagate token generation errors", async () => {
      // Arrange
      const command = new ResendEmailConfirmationCommand("test@example.com");

      const mockUser = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword",
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: false,
      });

      const tokenError = new Error("Token generation failed");

      userQueryRepository.findUserByEmail.mockResolvedValue(mockUser);
      tokenInvalidationRepo.invalidateAllUserTokens.mockResolvedValue(undefined);
      tokenService.generateToken.mockRejectedValue(tokenError);

      // Act & Assert
      await expect(resendEmailConfirmationHandler.execute(command)).rejects.toThrow(
        "Token generation failed",
      );

      // Verify that email service is not called
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe("TC007: Should handle email service failure and propagate email sending errors", () => {
    it("should propagate email sending errors", async () => {
      // Arrange
      const command = new ResendEmailConfirmationCommand("test@example.com");

      const mockUser = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword",
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: false,
      });

      const mockToken = "new-confirmation-token-123";
      const emailError = new Error("Email service unavailable");

      userQueryRepository.findUserByEmail.mockResolvedValue(mockUser);
      tokenInvalidationRepo.invalidateAllUserTokens.mockResolvedValue(undefined);
      tokenService.generateToken.mockResolvedValue(mockToken);
      emailService.sendEmail.mockRejectedValue(emailError);

      // Act & Assert
      await expect(resendEmailConfirmationHandler.execute(command)).rejects.toThrow(
        "Email service unavailable",
      );

      // Verify that token invalidation and generation still occurred
      expect(tokenInvalidationRepo.invalidateAllUserTokens).toHaveBeenCalled();
      expect(tokenService.generateToken).toHaveBeenCalled();
    });
  });
});
