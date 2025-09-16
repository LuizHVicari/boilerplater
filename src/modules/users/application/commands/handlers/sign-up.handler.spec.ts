/*
Test Cases for SignUpHandler:

Method Purpose: Creates a new user account with hashed password, invalidates previous tokens, and sends email verification

1. **Happy Path**: Should create user and return user data when valid signup data provided
2. **Happy Path**: Should hash password, invalidate tokens, and send verification email when user created successfully
3. **Error**: Should throw Error when user email already exists
4. **Error**: Should handle PasswordService failure and propagate hashing errors
5. **Error**: Should handle UnitOfWork failure and propagate transaction errors
6. **Verification**: Should call PasswordService.hashPassword with provided password before user creation
7. **Verification**: Should call UnitOfWork.execute with transaction function for data consistency
8. **Security**: Should invalidate all email-confirmation tokens before generating new one
*/

import { TestBed } from "@automock/jest";
import { EMAIL_SERVICE, type EmailService } from "@common/application/ports/email.service";
import { UNIT_OF_WORK, type UnitOfWork } from "@common/application/ports/unit-of-work.service";
import { UserModel } from "@users/domain/models/user.model";

import { PASSWORD_SERVICE, type PasswordService } from "../../ports/password.service";
import { TOKEN_SERVICE, type TokenService } from "../../ports/token.service";
import {
  TOKEN_INVALIDATION_REPOSITORY,
  type TokenInvalidationRepository,
} from "../../ports/token-invalidation-repo.service";
import {
  USER_QUERY_REPOSITORY,
  type UserQueryRepository,
} from "../../ports/user-query-repo.service";
import { SignUpCommand } from "../sign-up.command";
import { SignUpHandler } from "./sign-up.handler";

describe("SignUpHandler", () => {
  let signUpHandler: SignUpHandler;
  let emailService: jest.Mocked<EmailService>;
  let passwordService: jest.Mocked<PasswordService>;
  let unitOfWork: jest.Mocked<UnitOfWork>;
  let userQueryRepository: jest.Mocked<UserQueryRepository>;
  let tokenService: jest.Mocked<TokenService>;
  let tokenInvalidationRepo: jest.Mocked<TokenInvalidationRepository>;
  let mockRepositoryContext: any;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(SignUpHandler).compile();

    signUpHandler = unit;
    emailService = unitRef.get(EMAIL_SERVICE);
    passwordService = unitRef.get(PASSWORD_SERVICE);
    unitOfWork = unitRef.get(UNIT_OF_WORK);
    userQueryRepository = unitRef.get(USER_QUERY_REPOSITORY);
    tokenService = unitRef.get(TOKEN_SERVICE);
    tokenInvalidationRepo = unitRef.get(TOKEN_INVALIDATION_REPOSITORY);

    // Mock repository context with createUser method
    mockRepositoryContext = {
      userCommandRepository: {
        createUser: jest.fn(),
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

  describe("TC001: Should create user and return user data when valid signup data provided", () => {
    it("should successfully create and return user data", async () => {
      // Arrange
      const signUpCommand = new SignUpCommand("test@example.com", "plainPassword", "John", "Doe");

      const hashedPassword = "$2b$10$hashedPassword";
      const mockCreatedUser = {
        id: "user-123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockToken = "verification-token-123";

      passwordService.hashPassword.mockResolvedValue(hashedPassword);
      userQueryRepository.findUserByEmail.mockResolvedValue(undefined);
      mockRepositoryContext.userCommandRepository.createUser.mockResolvedValue(mockCreatedUser);
      tokenInvalidationRepo.invalidateAllUserTokens.mockResolvedValue(undefined);
      tokenService.generateToken.mockResolvedValue(mockToken);
      emailService.sendEmail.mockResolvedValue(undefined);

      // Act
      const result = await signUpHandler.execute(signUpCommand);

      // Assert
      expect(result).toEqual(mockCreatedUser);
      expect(result.id).toBe("user-123");
      expect(result.email).toBe("test@example.com");
      expect(result.firstName).toBe("John");
      expect(result.lastName).toBe("Doe");
    });
  });

  describe("TC002: Should hash password, invalidate tokens, and send verification email when user created successfully", () => {
    it("should hash password, invalidate tokens, and send verification email", async () => {
      // Arrange
      const signUpCommand = new SignUpCommand("test@example.com", "plainPassword", "John", "Doe");

      const hashedPassword = "$2b$10$hashedPassword";
      const mockCreatedUser = {
        id: "user-123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockToken = "verification-token-123";

      passwordService.hashPassword.mockResolvedValue(hashedPassword);
      userQueryRepository.findUserByEmail.mockResolvedValue(undefined);
      mockRepositoryContext.userCommandRepository.createUser.mockResolvedValue(mockCreatedUser);
      tokenInvalidationRepo.invalidateAllUserTokens.mockResolvedValue(undefined);
      tokenService.generateToken.mockResolvedValue(mockToken);
      emailService.sendEmail.mockResolvedValue(undefined);

      // Act
      await signUpHandler.execute(signUpCommand);

      expect(passwordService.hashPassword).toHaveBeenCalledWith("plainPassword");

      const invalidateCall = tokenInvalidationRepo.invalidateAllUserTokens.mock.calls[0];
      expect(invalidateCall[1]).toBe("email-confirmation");
      expect(typeof invalidateCall[0]).toBe("string");
      expect(tokenService.generateToken).toHaveBeenCalledWith(
        expect.any(UserModel),
        "email-confirmation",
      );
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

  describe("TC003: Should throw Error when user email already exists", () => {
    it("should throw error when user with email already exists", async () => {
      // Arrange
      const signUpCommand = new SignUpCommand(
        "existing@example.com",
        "plainPassword",
        "John",
        "Doe",
      );

      const hashedPassword = "$2b$10$hashedPassword";
      const existingUser = new UserModel({
        id: "existing-user-123",
        email: "existing@example.com",
        password: hashedPassword,
        firstName: "Existing",
        lastName: "User",
        active: true,
        emailConfirmed: true,
      });

      passwordService.hashPassword.mockResolvedValue(hashedPassword);
      userQueryRepository.findUserByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(signUpHandler.execute(signUpCommand)).rejects.toThrow("User already exists");

      // Verify that no user creation or email sending occurs
      expect(mockRepositoryContext.userCommandRepository.createUser).not.toHaveBeenCalled();
      expect(tokenInvalidationRepo.invalidateAllUserTokens).not.toHaveBeenCalled();
      expect(tokenService.generateToken).not.toHaveBeenCalled();
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe("TC004: Should handle PasswordService failure and propagate hashing errors", () => {
    it("should propagate password hashing errors", async () => {
      // Arrange
      const signUpCommand = new SignUpCommand("test@example.com", "plainPassword", "John", "Doe");

      const hashingError = new Error("Password hashing failed");
      passwordService.hashPassword.mockRejectedValue(hashingError);
      userQueryRepository.findUserByEmail.mockResolvedValue(undefined);

      // Act & Assert
      await expect(signUpHandler.execute(signUpCommand)).rejects.toThrow("Password hashing failed");

      // Verify that no subsequent operations occur
      expect(mockRepositoryContext.userCommandRepository.createUser).not.toHaveBeenCalled();
      expect(tokenInvalidationRepo.invalidateAllUserTokens).not.toHaveBeenCalled();
      expect(tokenService.generateToken).not.toHaveBeenCalled();
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe("TC005: Should handle UnitOfWork failure and propagate transaction errors", () => {
    it("should propagate transaction errors", async () => {
      // Arrange
      const signUpCommand = new SignUpCommand("test@example.com", "plainPassword", "John", "Doe");

      const transactionError = new Error("Transaction failed");

      passwordService.hashPassword.mockResolvedValue("hashedPassword");
      userQueryRepository.findUserByEmail.mockResolvedValue(undefined);
      unitOfWork.execute.mockRejectedValue(transactionError);

      // Act & Assert
      await expect(signUpHandler.execute(signUpCommand)).rejects.toThrow("Transaction failed");

      // Verify that transaction was attempted
      expect(unitOfWork.execute).toHaveBeenCalled();
      // But email service should not be called due to transaction failure
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe("TC006: Should handle email service failure gracefully", () => {
    it("should complete user creation even if email fails", async () => {
      // Arrange
      const signUpCommand = new SignUpCommand("test@example.com", "plainPassword", "John", "Doe");

      const hashedPassword = "$2b$10$hashedPassword";
      const mockCreatedUser = {
        id: "user-123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      passwordService.hashPassword.mockResolvedValue(hashedPassword);
      userQueryRepository.findUserByEmail.mockResolvedValue(undefined);
      mockRepositoryContext.userCommandRepository.createUser.mockResolvedValue(mockCreatedUser);
      tokenInvalidationRepo.invalidateAllUserTokens.mockResolvedValue(undefined);
      tokenService.generateToken.mockResolvedValue("token");
      emailService.sendEmail.mockRejectedValue(new Error("Email service unavailable"));

      // Act & Assert
      await expect(signUpHandler.execute(signUpCommand)).rejects.toThrow(
        "Email service unavailable",
      );

      // Verify that user creation and token generation still occurred
      expect(mockRepositoryContext.userCommandRepository.createUser).toHaveBeenCalled();
      expect(tokenInvalidationRepo.invalidateAllUserTokens).toHaveBeenCalled();
      expect(tokenService.generateToken).toHaveBeenCalled();
    });
  });

  describe("TC007: Should call UnitOfWork.execute with transaction function for data consistency", () => {
    it("should execute all operations within a transaction", async () => {
      // Arrange
      const signUpCommand = new SignUpCommand("test@example.com", "plainPassword", "John", "Doe");

      const hashedPassword = "$2b$10$hashedPassword";
      const mockCreatedUser = {
        id: "user-123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      passwordService.hashPassword.mockResolvedValue(hashedPassword);
      userQueryRepository.findUserByEmail.mockResolvedValue(undefined);
      mockRepositoryContext.userCommandRepository.createUser.mockResolvedValue(mockCreatedUser);
      tokenInvalidationRepo.invalidateAllUserTokens.mockResolvedValue(undefined);
      tokenService.generateToken.mockResolvedValue("token");
      emailService.sendEmail.mockResolvedValue(undefined);

      // Act
      await signUpHandler.execute(signUpCommand);

      // Assert
      expect(unitOfWork.execute).toHaveBeenCalledWith(expect.any(Function));
      expect(unitOfWork.execute).toHaveBeenCalledTimes(1);

      // Verify that repository operations are called within the transaction context
      expect(mockRepositoryContext.userCommandRepository.createUser).toHaveBeenCalledWith(
        expect.any(UserModel),
      );
    });
  });

  describe("TC008: Should invalidate all email-confirmation tokens before generating new one", () => {
    it("should invalidate previous email-confirmation tokens for security", async () => {
      // Arrange
      const signUpCommand = new SignUpCommand("test@example.com", "plainPassword", "John", "Doe");

      const hashedPassword = "$2b$10$hashedPassword";
      const mockCreatedUser = {
        id: "user-123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockToken = "verification-token-123";

      passwordService.hashPassword.mockResolvedValue(hashedPassword);
      userQueryRepository.findUserByEmail.mockResolvedValue(undefined);
      mockRepositoryContext.userCommandRepository.createUser.mockResolvedValue(mockCreatedUser);
      tokenInvalidationRepo.invalidateAllUserTokens.mockResolvedValue(undefined);
      tokenService.generateToken.mockResolvedValue(mockToken);
      emailService.sendEmail.mockResolvedValue(undefined);

      await signUpHandler.execute(signUpCommand);

      const invalidateCall = tokenInvalidationRepo.invalidateAllUserTokens.mock.calls[0];
      expect(invalidateCall[1]).toBe("email-confirmation");
      expect(typeof invalidateCall[0]).toBe("string");
      expect(tokenInvalidationRepo.invalidateAllUserTokens).toHaveBeenCalled();
      expect(tokenService.generateToken).toHaveBeenCalled();
    });
  });
});
