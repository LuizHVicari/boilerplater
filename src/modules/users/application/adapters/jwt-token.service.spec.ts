/*
Test Cases for JWTTokenService:
  Method Name: generateToken
    Method Purpose: Generate JWT tokens for different token types with user data

    1. **Happy Path**: Should generate access token with correct payload structure
    2. **Happy Path**: Should generate refresh token with correct payload structure
    3. **Happy Path**: Should generate email-confirmation token with correct payload structure
    4. **Happy Path**: Should generate password-recovery token with correct payload structure
    5. **Verification**: Should call JwtService.signAsync with correct secret and TTL for access tokens
    6. **Verification**: Should call JwtService.signAsync with correct secret and TTL for refresh tokens
    7. **Verification**: Should create payload with user.id as sub field
    8. **Verification**: Should generate unique jti (UUID) for each token
    9. **Error**: Should throw InvalidTokenError for unsupported token type

  Method Name: verifyToken
    Method Purpose: Verify and decode JWT tokens returning AuthToken objects

    10. **Happy Path**: Should verify and return AuthToken for valid access token
    11. **Happy Path**: Should verify and return AuthToken for valid refresh token
    12. **Happy Path**: Should verify and return AuthToken for valid email-confirmation token
    13. **Happy Path**: Should verify and return AuthToken for valid password-recovery token
    14. **Error**: Should throw InvalidTokenError when token has no type field
    15. **Error**: Should throw InvalidTokenError when token cannot be decoded
    16. **Error**: Should propagate JwtService verification errors
    17. **Error**: Should throw InvalidTokenError for unsupported token type in verification
    18. **Verification**: Should call JwtService.verifyAsync with correct secret based on token type
    19. **Verification**: Should first decode token to extract type before verification

  20. **Integration**: Should generate token and verify it successfully (round trip)
  21. **Edge Case**: Should handle tokens with different user IDs correctly
*/

import type { ConfigType } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InvalidTokenError } from "@shared/errors/domain-errors";

import jwtConfig from "../../config/jwt.config";
import { UserModel } from "../../domain/models/user.model";
import { AuthToken } from "../../domain/value-objects/auth-token.vo";
import { TokenService } from "../ports/token.service";
import { JWTTokenService } from "./jwt-token.service";

jest.mock("@nestjs/jwt");

describe("JWTTokenService", () => {
  let tokenService: TokenService;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockJwtConfig: ConfigType<typeof jwtConfig>;

  beforeAll(() => {
    mockJwtConfig = {
      accessSecret: "access-secret-32-chars-long-test",
      refreshSecret: "refresh-secret-32-chars-long-test",
      emailVerificationSecret: "email-secret-32-chars-long-test",
      passwordResetSecret: "password-secret-32-chars-long-test",
      accessTokenTtl: 900,
      refreshTokenTtl: 604800,
      emailVerificationTokenTtl: 86400,
      passwordResetTokenTtl: 3600,
    };
  });

  beforeEach(() => {
    mockJwtService = new JwtService({}) as jest.Mocked<JwtService>;
    tokenService = new JWTTokenService(mockJwtService, mockJwtConfig);
  });

  describe("generateToken", () => {
    it("TC001: Should generate access token with correct payload structure", async () => {
      // Arrange
      const user = new UserModel({
        id: "user-123",
        email: "test@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: true,
      });
      mockJwtService.signAsync.mockResolvedValue("mocked-jwt-token");

      // Act
      const result = await tokenService.generateToken(user, "access");

      // Assert
      expect(result).toBe("mocked-jwt-token");
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: "user-123",
          iat: expect.any(Number),
          jti: expect.any(String),
          type: "access",
        }),
        {
          secret: "access-secret-32-chars-long-test",
          expiresIn: 900,
        },
      );
    });

    it("TC002: Should generate refresh token with correct payload structure", async () => {
      // Arrange
      const user = new UserModel({
        id: "user-456",
        email: "refresh@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: true,
      });
      mockJwtService.signAsync.mockResolvedValue("refresh-jwt-token");

      // Act
      const result = await tokenService.generateToken(user, "refresh");

      // Assert
      expect(result).toBe("refresh-jwt-token");
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: "user-456",
          iat: expect.any(Number),
          jti: expect.any(String),
          type: "refresh",
        }),
        {
          secret: "refresh-secret-32-chars-long-test",
          expiresIn: 604800,
        },
      );
    });

    it("TC003: Should generate email-confirmation token with correct payload structure", async () => {
      // Arrange
      const user = new UserModel({
        id: "user-789",
        email: "email@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: false,
      });
      mockJwtService.signAsync.mockResolvedValue("email-jwt-token");

      // Act
      const result = await tokenService.generateToken(user, "email-confirmation");

      // Assert
      expect(result).toBe("email-jwt-token");
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: "user-789",
          iat: expect.any(Number),
          jti: expect.any(String),
          type: "email-confirmation",
        }),
        {
          secret: "email-secret-32-chars-long-test",
          expiresIn: 86400,
        },
      );
    });

    it("TC004: Should generate password-recovery token with correct payload structure", async () => {
      // Arrange
      const user = new UserModel({
        id: "user-abc",
        email: "recovery@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: true,
      });
      mockJwtService.signAsync.mockResolvedValue("recovery-jwt-token");

      // Act
      const result = await tokenService.generateToken(user, "password-recovery");

      // Assert
      expect(result).toBe("recovery-jwt-token");
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: "user-abc",
          iat: expect.any(Number),
          jti: expect.any(String),
          type: "password-recovery",
        }),
        {
          secret: "password-secret-32-chars-long-test",
          expiresIn: 3600,
        },
      );
    });

    it("TC005: Should call JwtService.signAsync with correct secret and TTL for access tokens", async () => {
      // Arrange
      const user = new UserModel({
        id: "user-test",
        email: "test@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: true,
      });
      mockJwtService.signAsync.mockResolvedValue("test-token");

      // Act
      await tokenService.generateToken(user, "access");

      // Assert
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(expect.any(Object), {
        secret: "access-secret-32-chars-long-test",
        expiresIn: 900,
      });
    });

    it("TC006: Should call JwtService.signAsync with correct secret and TTL for refresh tokens", async () => {
      // Arrange
      const user = new UserModel({
        id: "user-test",
        email: "test@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: true,
      });
      mockJwtService.signAsync.mockResolvedValue("test-token");

      // Act
      await tokenService.generateToken(user, "refresh");

      // Assert
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(expect.any(Object), {
        secret: "refresh-secret-32-chars-long-test",
        expiresIn: 604800,
      });
    });

    it("TC007: Should create payload with user.id as sub field", async () => {
      // Arrange
      const user = new UserModel({
        id: "specific-user-id",
        email: "test@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: true,
      });
      mockJwtService.signAsync.mockResolvedValue("test-token");

      // Act
      await tokenService.generateToken(user, "access");

      // Assert
      const callArgs = mockJwtService.signAsync.mock.calls[0][0] as {
        sub: string;
        iat: number;
        jti: string;
        type: string;
      };
      expect(callArgs.sub).toBe("specific-user-id");
    });

    it("TC008: Should generate unique jti (UUID) for each token", async () => {
      // Arrange
      const user = new UserModel({
        id: "user-test",
        email: "test@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: true,
      });
      mockJwtService.signAsync.mockResolvedValue("test-token");

      // Act
      await tokenService.generateToken(user, "access");
      await tokenService.generateToken(user, "access");

      // Assert
      const call1Args = mockJwtService.signAsync.mock.calls[0][0] as {
        sub: string;
        iat: number;
        jti: string;
        type: string;
      };
      const call2Args = mockJwtService.signAsync.mock.calls[1][0] as {
        sub: string;
        iat: number;
        jti: string;
        type: string;
      };
      expect(call1Args.jti).toBeDefined();
      expect(call2Args.jti).toBeDefined();
      expect(call1Args.jti).not.toBe(call2Args.jti);
      expect(call1Args.jti).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it("TC009: Should throw InvalidTokenError for unsupported token type", () => {
      // Arrange
      const user = new UserModel({
        id: "user-test",
        email: "test@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: true,
      });

      // Act & Assert
      expect(() => tokenService.generateToken(user, "invalid-type" as any)).toThrow(
        InvalidTokenError,
      );
    });
  });

  describe("verifyToken", () => {
    it("TC010: Should verify and return AuthToken for valid access token", async () => {
      // Arrange
      const mockPayload = {
        sub: "user-123",
        iat: 1000000,
        exp: 1000900,
        jti: "jti-123",
        type: "access" as const,
      };
      mockJwtService.decode.mockReturnValue(mockPayload);
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      // Act
      const result = await tokenService.verifyToken("valid-access-token");

      // Assert
      expect(result).toBeInstanceOf(AuthToken);
      expect(result.sub).toBe("user-123");
      expect(result.type).toBe("access");
      expect(result.iat).toBe(1000000);
      expect(result.exp).toBe(1000900);
      expect(result.jti).toBe("jti-123");
    });

    it("TC011: Should verify and return AuthToken for valid refresh token", async () => {
      // Arrange
      const mockPayload = {
        sub: "user-456",
        iat: 2000000,
        exp: 2604800,
        jti: "jti-456",
        type: "refresh" as const,
      };
      mockJwtService.decode.mockReturnValue(mockPayload);
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      // Act
      const result = await tokenService.verifyToken("valid-refresh-token");

      // Assert
      expect(result).toBeInstanceOf(AuthToken);
      expect(result.sub).toBe("user-456");
      expect(result.type).toBe("refresh");
      expect(result.iat).toBe(2000000);
      expect(result.exp).toBe(2604800);
      expect(result.jti).toBe("jti-456");
    });

    it("TC012: Should verify and return AuthToken for valid email-confirmation token", async () => {
      // Arrange
      const mockPayload = {
        sub: "user-789",
        iat: 3000000,
        exp: 3086400,
        jti: "jti-789",
        type: "email-confirmation" as const,
      };
      mockJwtService.decode.mockReturnValue(mockPayload);
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      // Act
      const result = await tokenService.verifyToken("valid-email-token");

      // Assert
      expect(result).toBeInstanceOf(AuthToken);
      expect(result.sub).toBe("user-789");
      expect(result.type).toBe("email-confirmation");
      expect(result.iat).toBe(3000000);
      expect(result.exp).toBe(3086400);
      expect(result.jti).toBe("jti-789");
    });

    it("TC013: Should verify and return AuthToken for valid password-recovery token", async () => {
      // Arrange
      const mockPayload = {
        sub: "user-abc",
        iat: 4000000,
        exp: 4003600,
        jti: "jti-abc",
        type: "password-recovery" as const,
      };
      mockJwtService.decode.mockReturnValue(mockPayload);
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      // Act
      const result = await tokenService.verifyToken("valid-recovery-token");

      // Assert
      expect(result).toBeInstanceOf(AuthToken);
      expect(result.sub).toBe("user-abc");
      expect(result.type).toBe("password-recovery");
      expect(result.iat).toBe(4000000);
      expect(result.exp).toBe(4003600);
      expect(result.jti).toBe("jti-abc");
    });

    it("TC014: Should throw InvalidTokenError when token has no type field", async () => {
      // Arrange
      const mockPayload = {
        sub: "user-123",
        iat: 1000000,
        exp: 1000900,
        jti: "jti-123",
      };
      mockJwtService.decode.mockReturnValue(mockPayload);

      // Act & Assert
      await expect(tokenService.verifyToken("token-without-type")).rejects.toThrow(
        InvalidTokenError,
      );
    });

    it("TC015: Should throw InvalidTokenError when token cannot be decoded", async () => {
      // Arrange
      mockJwtService.decode.mockReturnValue(null);

      // Act & Assert
      await expect(tokenService.verifyToken("invalid-token")).rejects.toThrow(InvalidTokenError);
    });

    it("TC016: Should propagate JwtService verification errors", async () => {
      // Arrange
      const mockPayload = {
        sub: "user-123",
        iat: 1000000,
        exp: 1000900,
        jti: "jti-123",
        type: "access" as const,
      };
      mockJwtService.decode.mockReturnValue(mockPayload);
      mockJwtService.verifyAsync.mockRejectedValue(new Error("Token expired"));

      // Act & Assert
      await expect(tokenService.verifyToken("expired-token")).rejects.toThrow("Token expired");
    });

    it("TC017: Should throw InvalidTokenError for unsupported token type in verification", async () => {
      // Arrange
      const mockPayload = {
        sub: "user-123",
        iat: 1000000,
        exp: 1000900,
        jti: "jti-123",
        type: "invalid-type" as any,
      };
      mockJwtService.decode.mockReturnValue(mockPayload);

      // Act & Assert
      await expect(tokenService.verifyToken("token-with-invalid-type")).rejects.toThrow(
        InvalidTokenError,
      );
    });

    it("TC018: Should call JwtService.verifyAsync with correct secret based on token type", async () => {
      // Arrange
      const mockPayload = {
        sub: "user-123",
        iat: 1000000,
        exp: 1000900,
        jti: "jti-123",
        type: "access" as const,
      };
      mockJwtService.decode.mockReturnValue(mockPayload);
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      // Act
      await tokenService.verifyToken("access-token");

      // Assert
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith("access-token", {
        secret: "access-secret-32-chars-long-test",
      });
    });

    it("TC019: Should first decode token to extract type before verification", async () => {
      // Arrange
      const mockPayload = {
        sub: "user-123",
        iat: 1000000,
        exp: 1000900,
        jti: "jti-123",
        type: "refresh" as const,
      };
      mockJwtService.decode.mockReturnValue(mockPayload);
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      // Act
      await tokenService.verifyToken("refresh-token");

      // Assert
      expect(mockJwtService.decode).toHaveBeenCalledWith("refresh-token");
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith("refresh-token", {
        secret: "refresh-secret-32-chars-long-test",
      });
    });
  });

  describe("Integration", () => {
    it("TC020: Should generate token and verify it successfully (round trip)", async () => {
      // Arrange
      const user = new UserModel({
        id: "integration-user",
        email: "integration@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: true,
      });

      mockJwtService.signAsync.mockResolvedValue("generated-jwt-token");

      const expectedPayload = {
        sub: "integration-user",
        iat: expect.any(Number),
        exp: expect.any(Number),
        jti: expect.any(String),
        type: "access" as const,
      };
      mockJwtService.decode.mockReturnValue(expectedPayload);
      mockJwtService.verifyAsync.mockResolvedValue(expectedPayload);

      // Act
      const generatedToken = await tokenService.generateToken(user, "access");
      const verifiedToken = await tokenService.verifyToken(generatedToken);

      // Assert
      expect(generatedToken).toBe("generated-jwt-token");
      expect(verifiedToken).toBeInstanceOf(AuthToken);
      expect(verifiedToken.sub).toBe("integration-user");
      expect(verifiedToken.type).toBe("access");
      expect(mockJwtService.signAsync).toHaveBeenCalled();
      expect(mockJwtService.decode).toHaveBeenCalledWith("generated-jwt-token");
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith("generated-jwt-token", {
        secret: "access-secret-32-chars-long-test",
      });
    });
  });

  describe("Edge Case", () => {
    it("TC021: Should handle tokens with different user IDs correctly", async () => {
      // Arrange
      const user1 = new UserModel({
        id: "user-one",
        email: "user1@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: true,
      });

      const user2 = new UserModel({
        id: "user-two",
        email: "user2@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: true,
      });

      mockJwtService.signAsync.mockResolvedValue("test-token");

      // Act
      await tokenService.generateToken(user1, "access");
      await tokenService.generateToken(user2, "refresh");

      // Assert
      const call1Args = mockJwtService.signAsync.mock.calls[0][0] as {
        sub: string;
        iat: number;
        jti: string;
        type: string;
      };
      const call2Args = mockJwtService.signAsync.mock.calls[1][0] as {
        sub: string;
        iat: number;
        jti: string;
        type: string;
      };

      expect(call1Args.sub).toBe("user-one");
      expect(call1Args.type).toBe("access");
      expect(call2Args.sub).toBe("user-two");
      expect(call2Args.type).toBe("refresh");

      expect(mockJwtService.signAsync.mock.calls[0]?.[1]?.secret).toBe(
        "access-secret-32-chars-long-test",
      );
      expect(mockJwtService.signAsync.mock.calls[1]?.[1]?.secret).toBe(
        "refresh-secret-32-chars-long-test",
      );
    });
  });
});
