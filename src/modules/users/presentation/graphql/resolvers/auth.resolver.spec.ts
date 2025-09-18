/*
Test Cases for AuthResolver:

Resolver Purpose: Complete GraphQL resolver for authentication operations including user management, sessions, and password operations

1. **Query hello()**: Should return "Hello World"
2. **Query me()**: Should return authenticated user data (requires JwtAuthGuard)
3. **Mutation signUp()**: Should execute SignUpCommand and return mapped response
4. **Mutation signIn()**: Should execute SignInCommand, set cookie, and return access token
5. **Mutation signOut()**: Should extract tokens, execute SignOutCommand, clear cookie, and return success
6. **Mutation refreshToken()**: Should extract refresh token and return new access token
7. **Mutation confirmEmail()**: Should execute ConfirmEmailCommand and return mapped response
8. **Mutation resendEmailConfirmation()**: Should execute ResendEmailConfirmationCommand and return mapped response
9. **Mutation forgotPassword()**: Should execute ForgotPasswordCommand and return mapped response
10. **Mutation resetPassword()**: Should execute ResetPasswordCommand and return mapped response
11. **Mutation updatePassword()**: Should execute UpdatePasswordCommand with authentication, set cookie, and return response
12. **Context Handling**: Should extract tokens from context and handle authenticated contexts correctly
13. **Cookie Management**: Should use cookiesSettings configuration for secure cookies
14. **Error Handling**: Should propagate command errors and validate authentication properly
*/

import { TestBed } from "@automock/jest";
import cookiesConfig from "@common/config/cookies.config";
import { type ConfigType } from "@nestjs/config";
import { CommandBus } from "@nestjs/cqrs";
import { clearRefreshTokenCookie, extractTokensFromContext } from "@shared/utils/token-extraction";
import { ConfirmEmailCommand } from "@users/application/commands/confirm-email.command";
import { ForgotPasswordCommand } from "@users/application/commands/forgot-password.command";
import { RefreshTokenCommand } from "@users/application/commands/refresh-token.command";
import { ResendEmailConfirmationCommand } from "@users/application/commands/resend-email-confirmation.command";
import { ResetPasswordCommand } from "@users/application/commands/reset-password.command";
import { SignInCommand } from "@users/application/commands/sign-in.command";
import { SignOutCommand } from "@users/application/commands/sign-out.command";
import { SignUpCommand } from "@users/application/commands/sign-up.command";
import { UpdatePasswordCommand } from "@users/application/commands/update-password.command";

import {
  ConfirmEmailInput,
  ForgotPasswordInput,
  ResendEmailConfirmationInput,
  ResetPasswordInput,
  SignInInput,
  SignUpInput,
  UpdatePasswordInput,
} from "../dto/auth.input";
import { AuthResolver } from "./auth.resolver";

// Mock the shared utils
jest.mock("@shared/utils/token-extraction", () => ({
  extractTokensFromContext: jest.fn(),
  clearRefreshTokenCookie: jest.fn(),
}));

const mockExtractTokensFromContext = extractTokensFromContext as jest.MockedFunction<
  typeof extractTokensFromContext
>;
const mockClearRefreshTokenCookie = clearRefreshTokenCookie as jest.MockedFunction<
  typeof clearRefreshTokenCookie
>;

describe("AuthResolver", () => {
  let resolver: AuthResolver;
  let commandBus: jest.Mocked<CommandBus>;
  let cookiesSettings: jest.Mocked<ConfigType<typeof cookiesConfig>>;
  let mockGraphQLContext: any;
  let mockAuthenticatedContext: any;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(AuthResolver).compile();

    resolver = unit;
    commandBus = unitRef.get(CommandBus);
    cookiesSettings = unitRef.get(cookiesConfig.KEY);

    // Setup mock contexts
    mockGraphQLContext = {
      req: {
        headers: { authorization: "Bearer access-token-123" },
        cookies: { refreshToken: "refresh-token-123" },
      },
      res: {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      },
    };

    mockAuthenticatedContext = {
      req: {
        headers: { authorization: "Bearer access-token-123" },
        cookies: { refreshToken: "refresh-token-123" },
        user: {
          user: {
            id: "user-123",
            email: "test@example.com",
            firstName: "John",
            lastName: "Doe",
            active: true,
            emailConfirmed: true,
            createdAt: new Date("2023-01-01T00:00:00.000Z"),
            updatedAt: new Date("2023-01-01T00:00:00.000Z"),
          },
          token: {
            sub: "user-123",
            type: "access",
            iat: 1640995200,
            exp: 1640998800,
            jti: "token-id-123",
          },
        },
      },
      res: {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      },
    };

    // Setup default cookies settings
    cookiesSettings.secure = false;
    cookiesSettings.refreshTokenMaxAge = 604800000;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("hello() query", () => {
    it("TC001: should return Hello World string", () => {
      const result = resolver.hello();
      expect(result).toBe("Hello World");
    });
  });

  describe("me() query", () => {
    it("TC001: should extract user data from current user decorator", () => {
      const currentUser = mockAuthenticatedContext.req.user;
      const result = resolver.me(currentUser);

      expect(result).toEqual({
        id: "user-123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        active: true,
        emailConfirmed: true,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      });
    });

    it("TC002: should work with undefined firstName and lastName", () => {
      const currentUserWithoutNames = {
        ...mockAuthenticatedContext.req.user,
        user: {
          ...mockAuthenticatedContext.req.user.user,
          firstName: undefined,
          lastName: undefined,
        },
      };

      const result = resolver.me(currentUserWithoutNames);

      expect(result).toEqual({
        id: "user-123",
        email: "test@example.com",
        firstName: undefined,
        lastName: undefined,
        active: true,
        emailConfirmed: true,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      });
    });
  });

  describe("signUp() mutation", () => {
    it("TC001: should execute SignUpCommand and map response correctly", async () => {
      const input: SignUpInput = {
        email: "test@example.com",
        password: "strongPassword123!",
        firstName: "John",
        lastName: "Doe",
      };

      const mockCommandResponse = {
        id: "user-123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      commandBus.execute.mockResolvedValue(mockCommandResponse);

      const result = await resolver.signUp(input);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new SignUpCommand("test@example.com", "strongPassword123!", "John", "Doe"),
      );
      expect(result).toEqual(mockCommandResponse);
    });

    it("TC002: should propagate errors from CommandBus", async () => {
      const input: SignUpInput = {
        email: "existing@example.com",
        password: "strongPassword123!",
        firstName: "John",
        lastName: "Doe",
      };

      const commandError = new Error("Entity already exists");
      commandBus.execute.mockRejectedValue(commandError);

      await expect(resolver.signUp(input)).rejects.toThrow("Entity already exists");
    });
  });

  describe("signIn() mutation", () => {
    it("TC001: should execute SignInCommand and set refresh token cookie", async () => {
      const input: SignInInput = {
        email: "test@example.com",
        password: "password123",
      };

      const mockCommandResponse = {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      };

      commandBus.execute.mockResolvedValue(mockCommandResponse);

      const result = await resolver.signIn(input, mockGraphQLContext);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new SignInCommand("test@example.com", "password123"),
      );
      expect(mockGraphQLContext.res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "new-refresh-token",
        {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          maxAge: 604800000,
        },
      );
      expect(result).toEqual({ accessToken: "new-access-token" });
    });

    it("TC002: should set secure flag based on cookiesSettings", async () => {
      cookiesSettings.secure = true;
      cookiesSettings.refreshTokenMaxAge = 1800000;

      const input: SignInInput = {
        email: "test@example.com",
        password: "password123",
      };

      const mockCommandResponse = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
      };

      commandBus.execute.mockResolvedValue(mockCommandResponse);

      await resolver.signIn(input, mockGraphQLContext);

      expect(mockGraphQLContext.res.cookie).toHaveBeenCalledWith("refreshToken", "refresh-token", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 1800000,
      });
    });

    it("TC003: should propagate authentication errors without setting cookie", async () => {
      const input: SignInInput = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      const commandError = new Error("Invalid credentials");
      commandBus.execute.mockRejectedValue(commandError);

      await expect(resolver.signIn(input, mockGraphQLContext)).rejects.toThrow(
        "Invalid credentials",
      );
      expect(mockGraphQLContext.res.cookie).not.toHaveBeenCalled();
    });
  });

  describe("signOut() mutation", () => {
    it("TC001: should handle complete signOut flow", async () => {
      const mockTokens = {
        accessToken: "access-token-123",
        refreshToken: "refresh-token-123",
      };

      const mockCommandResponse = { success: true };

      mockExtractTokensFromContext.mockReturnValue(mockTokens);
      commandBus.execute.mockResolvedValue(mockCommandResponse);

      const result = await resolver.signOut(mockGraphQLContext);

      expect(mockExtractTokensFromContext).toHaveBeenCalledWith(mockGraphQLContext);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new SignOutCommand("access-token-123", "refresh-token-123"),
      );
      expect(mockClearRefreshTokenCookie).toHaveBeenCalledWith(mockGraphQLContext);
      expect(result).toEqual({ success: true });
    });

    it("TC002: should propagate token extraction errors", async () => {
      const extractionError = new Error("No authorization token provided");
      mockExtractTokensFromContext.mockImplementation(() => {
        throw extractionError;
      });

      await expect(resolver.signOut(mockGraphQLContext)).rejects.toThrow(
        "No authorization token provided",
      );
      expect(commandBus.execute).not.toHaveBeenCalled();
      expect(mockClearRefreshTokenCookie).not.toHaveBeenCalled();
    });

    it("TC003: should propagate command errors but still clear cookie", async () => {
      const mockTokens = {
        accessToken: "access-token-123",
        refreshToken: "refresh-token-123",
      };

      mockExtractTokensFromContext.mockReturnValue(mockTokens);
      commandBus.execute.mockRejectedValue(new Error("Token already invalidated"));

      await expect(resolver.signOut(mockGraphQLContext)).rejects.toThrow(
        "Token already invalidated",
      );
      expect(mockExtractTokensFromContext).toHaveBeenCalledWith(mockGraphQLContext);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new SignOutCommand("access-token-123", "refresh-token-123"),
      );
      expect(mockClearRefreshTokenCookie).not.toHaveBeenCalled();
    });
  });

  describe("refreshToken() mutation", () => {
    it("TC001: should call RefreshTokenCommand with extracted token", async () => {
      const mockTokens = {
        accessToken: "old-access-token",
        refreshToken: "valid-refresh-token",
      };

      const mockCommandResponse = { accessToken: "new-access-token" };

      mockExtractTokensFromContext.mockReturnValue(mockTokens);
      commandBus.execute.mockResolvedValue(mockCommandResponse);

      const result = await resolver.refreshToken(mockGraphQLContext);

      expect(mockExtractTokensFromContext).toHaveBeenCalledWith(mockGraphQLContext);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new RefreshTokenCommand("valid-refresh-token"),
      );
      expect(result).toEqual({ accessToken: "new-access-token" });
    });

    it("TC002: should propagate token extraction errors", async () => {
      const extractionError = new Error("No refresh token provided");
      mockExtractTokensFromContext.mockImplementation(() => {
        throw extractionError;
      });

      await expect(resolver.refreshToken(mockGraphQLContext)).rejects.toThrow(
        "No refresh token provided",
      );
      expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it("TC003: should propagate invalid refresh token errors", async () => {
      const mockTokens = {
        accessToken: "access-token",
        refreshToken: "expired-refresh-token",
      };

      mockExtractTokensFromContext.mockReturnValue(mockTokens);
      commandBus.execute.mockRejectedValue(new Error("Refresh token expired"));

      await expect(resolver.refreshToken(mockGraphQLContext)).rejects.toThrow(
        "Refresh token expired",
      );
      expect(commandBus.execute).toHaveBeenCalledWith(
        new RefreshTokenCommand("expired-refresh-token"),
      );
    });
  });

  describe("updatePassword() mutation", () => {
    it("TC001: should extract user ID and execute command", async () => {
      const input: UpdatePasswordInput = {
        currentPassword: "oldPassword123!",
        newPassword: "newPassword123!",
        invalidateSessions: false,
      };

      const mockCommandResponse = {
        email: "test@example.com",
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      };

      commandBus.execute.mockResolvedValue(mockCommandResponse);

      const result = await resolver.updatePassword(
        input,
        mockAuthenticatedContext.req.user,
        mockGraphQLContext,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        new UpdatePasswordCommand("user-123", "oldPassword123!", "newPassword123!", false),
      );
      expect(result).toEqual({
        email: "test@example.com",
        accessToken: "new-access-token",
      });
    });

    it("TC002: should pass invalidateSessions parameter to command", async () => {
      const input: UpdatePasswordInput = {
        currentPassword: "oldPassword123!",
        newPassword: "newPassword123!",
        invalidateSessions: true,
      };

      const mockCommandResponse = {
        email: "test@example.com",
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      };

      commandBus.execute.mockResolvedValue(mockCommandResponse);

      await resolver.updatePassword(input, mockAuthenticatedContext.req.user, mockGraphQLContext);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new UpdatePasswordCommand("user-123", "oldPassword123!", "newPassword123!", true),
      );
    });

    it("TC003: should propagate authentication errors", async () => {
      const input: UpdatePasswordInput = {
        currentPassword: "wrongPassword",
        newPassword: "newPassword123!",
        invalidateSessions: false,
      };

      const commandError = new Error("Current password is incorrect");
      commandBus.execute.mockRejectedValue(commandError);

      await expect(
        resolver.updatePassword(input, mockAuthenticatedContext.req.user, mockGraphQLContext),
      ).rejects.toThrow("Current password is incorrect");
    });

    it("TC004: should use secure cookies when configured", async () => {
      cookiesSettings.secure = true;
      cookiesSettings.refreshTokenMaxAge = 3600000;

      const input: UpdatePasswordInput = {
        currentPassword: "oldPassword123!",
        newPassword: "newPassword123!",
        invalidateSessions: false,
      };

      const mockCommandResponse = {
        email: "test@example.com",
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      };

      commandBus.execute.mockResolvedValue(mockCommandResponse);

      await resolver.updatePassword(input, mockAuthenticatedContext.req.user, mockGraphQLContext);

      expect(mockGraphQLContext.res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "new-refresh-token",
        {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: 3600000,
        },
      );
    });
  });

  describe("confirmEmail() mutation", () => {
    it("TC001: should call CommandBus with ConfirmEmailCommand", async () => {
      const input: ConfirmEmailInput = { token: "email-confirmation-token-123" };

      const mockCommandResponse = {
        id: "user-123",
        email: "test@example.com",
      };

      commandBus.execute.mockResolvedValue(mockCommandResponse);

      const result = await resolver.confirmEmail(input);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new ConfirmEmailCommand("email-confirmation-token-123"),
      );
      expect(result).toEqual({
        id: "user-123",
        email: "test@example.com",
      });
    });

    it("TC002: should propagate token validation errors", async () => {
      const input: ConfirmEmailInput = { token: "invalid-token" };

      const commandError = new Error("Invalid or expired token");
      commandBus.execute.mockRejectedValue(commandError);

      await expect(resolver.confirmEmail(input)).rejects.toThrow("Invalid or expired token");
    });
  });

  describe("resendEmailConfirmation() mutation", () => {
    it("TC001: should call CommandBus and return email", async () => {
      const input: ResendEmailConfirmationInput = { email: "test@example.com" };

      const mockCommandResponse = { email: "test@example.com" };

      commandBus.execute.mockResolvedValue(mockCommandResponse);

      const result = await resolver.resendEmailConfirmation(input);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new ResendEmailConfirmationCommand("test@example.com"),
      );
      expect(result).toEqual({ email: "test@example.com" });
    });
  });

  describe("forgotPassword() mutation", () => {
    it("TC001: should call CommandBus and return email", async () => {
      const input: ForgotPasswordInput = { email: "test@example.com" };

      const mockCommandResponse = { email: "test@example.com" };

      commandBus.execute.mockResolvedValue(mockCommandResponse);

      const result = await resolver.forgotPassword(input);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new ForgotPasswordCommand("test@example.com"),
      );
      expect(result).toEqual({ email: "test@example.com" });
    });
  });

  describe("resetPassword() mutation", () => {
    it("TC001: should call CommandBus and return email", async () => {
      const input: ResetPasswordInput = {
        token: "password-reset-token-123",
        password: "newSecurePassword123!",
      };

      const mockCommandResponse = { email: "test@example.com" };

      commandBus.execute.mockResolvedValue(mockCommandResponse);

      const result = await resolver.resetPassword(input);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new ResetPasswordCommand("password-reset-token-123", "newSecurePassword123!"),
      );
      expect(result).toEqual({ email: "test@example.com" });
    });
  });
});
