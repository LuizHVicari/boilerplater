/*
  Test Cases for Token Extraction Utilities:
    extractTokensFromContext Tests:
      1. **Happy Path**: Should extract access token from Bearer header and refresh token from cookie
      2. **Bearer Token Only**: Should extract access token when no refresh token cookie exists
      3. **Empty Refresh Token**: Should handle empty refresh token cookie
      4. **Missing Authorization**: Should throw error when no authorization header provided
      5. **Array Authorization**: Should throw error when authorization header is an array
      6. **Invalid Bearer Format**: Should throw error when header doesn't start with 'Bearer '
      7. **Bearer Without Token**: Should handle Bearer header without token
      8. **Edge Cases**: Should handle various Bearer token formats

    clearRefreshTokenCookie Tests:
      9. **Clear Cookie**: Should call clearCookie with refreshToken parameter
      10. **Context Integration**: Should work with GraphQL context structure
*/

import { GraphQLContext } from "../types/http.types";
import { clearRefreshTokenCookie, extractTokensFromContext } from "./token-extraction";

describe("Token Extraction Utilities", () => {
  describe("extractTokensFromContext", () => {
    const createMockContext = (
      authorizationHeader?: string | string[],
      refreshTokenCookie?: string,
    ): GraphQLContext =>
      ({
        req: {
          headers: {
            authorization: authorizationHeader,
          },
          cookies: refreshTokenCookie !== undefined ? { refreshToken: refreshTokenCookie } : {},
        },
        res: {
          clearCookie: jest.fn(),
        },
      }) as any;

    it("TC001: Should extract access token from Bearer header and refresh token from cookie", () => {
      const mockContext = createMockContext(
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
        "refresh-token-123",
      );

      const result = extractTokensFromContext(mockContext);

      expect(result).toEqual({
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
        refreshToken: "refresh-token-123",
      });
    });

    it("TC002: Should extract access token when no refresh token cookie exists", () => {
      const mockContext = createMockContext("Bearer access-token-456");

      const result = extractTokensFromContext(mockContext);

      expect(result).toEqual({
        accessToken: "access-token-456",
        refreshToken: "",
      });
    });

    it("TC003: Should handle empty refresh token cookie", () => {
      const mockContext = createMockContext("Bearer access-token-789", "");

      const result = extractTokensFromContext(mockContext);

      expect(result).toEqual({
        accessToken: "access-token-789",
        refreshToken: "",
      });
    });

    it("TC004: Should throw error when no authorization header provided", () => {
      const mockContext = createMockContext(undefined, "refresh-token");

      expect(() => extractTokensFromContext(mockContext)).toThrow(
        "No authorization token provided",
      );
    });

    it("TC005: Should throw error when authorization header is an array", () => {
      const mockContext = createMockContext(["Bearer token1", "Bearer token2"], "refresh-token");

      expect(() => extractTokensFromContext(mockContext)).toThrow(
        "No authorization token provided",
      );
    });

    it("TC006: Should throw error when header doesn't start with 'Bearer '", () => {
      const testCases = [
        "Basic dXNlcjpwYXNz",
        "Token abc123",
        "bearer lowercase",
        "Bearer",
        "JWT eyJhbGciOiJIUzI1NiJ9",
        "ApiKey secret-key",
      ];

      testCases.forEach(invalidHeader => {
        const mockContext = createMockContext(invalidHeader, "refresh-token");

        expect(() => extractTokensFromContext(mockContext)).toThrow(
          "Invalid authorization header format",
        );
      });
    });

    it("TC007: Should handle Bearer header without token", () => {
      const mockContext = createMockContext("Bearer ", "refresh-token");

      const result = extractTokensFromContext(mockContext);

      expect(result).toEqual({
        accessToken: "",
        refreshToken: "refresh-token",
      });
    });

    it("TC008: Should handle various Bearer token formats", () => {
      const testCases = [
        {
          header:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
          expected:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
        },
        {
          header: "Bearer simple-token",
          expected: "simple-token",
        },
        {
          header: "Bearer token-with-dashes-and_underscores",
          expected: "token-with-dashes-and_underscores",
        },
        {
          header: "Bearer 123456789",
          expected: "123456789",
        },
      ];

      testCases.forEach(({ header, expected }) => {
        const mockContext = createMockContext(header, "refresh");

        const result = extractTokensFromContext(mockContext);

        expect(result.accessToken).toBe(expected);
        expect(result.refreshToken).toBe("refresh");
      });
    });
  });

  describe("clearRefreshTokenCookie", () => {
    it("TC009: Should call clearCookie with refreshToken parameter", () => {
      const mockClearCookie = jest.fn();
      const mockContext = {
        req: { headers: {}, cookies: {} },
        res: { clearCookie: mockClearCookie },
      } as any;

      clearRefreshTokenCookie(mockContext);

      expect(mockClearCookie).toHaveBeenCalledTimes(1);
      expect(mockClearCookie).toHaveBeenCalledWith("refreshToken");
    });

    it("TC010: Should work with GraphQL context structure", () => {
      const mockClearCookie = jest.fn();
      const mockContext: GraphQLContext = {
        req: {
          headers: { authorization: "Bearer test" },
          cookies: { refreshToken: "existing-token" },
        },
        res: {
          clearCookie: mockClearCookie,
        },
      } as any;

      clearRefreshTokenCookie(mockContext);

      expect(mockClearCookie).toHaveBeenCalledWith("refreshToken");
    });
  });
});
