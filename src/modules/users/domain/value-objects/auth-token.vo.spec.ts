/*
  Test Cases for AuthToken:
    Constructor Tests:
      1. **Happy Path**: Should create AuthToken with all required properties
      2. **Token Types**: Should handle all valid token types (access, refresh, email-confirmation, password-recovery)
      3. **Property Assignment**: Should correctly assign all readonly properties

    Authentication Validation Tests:
      4. **isValidForAuthentication - Access**: Should return true for access tokens
      5. **isValidForAuthentication - Refresh**: Should return false for refresh tokens
      6. **isValidForAuthentication - Email**: Should return false for email-confirmation tokens
      7. **isValidForAuthentication - Password**: Should return false for password-recovery tokens

    Refresh Validation Tests:
      8. **isValidForRefresh - Access**: Should return false for access tokens
      9. **isValidForRefresh - Refresh**: Should return true for refresh tokens
      10. **isValidForRefresh - Email**: Should return false for email-confirmation tokens
      11. **isValidForRefresh - Password**: Should return false for password-recovery tokens

    Expiration Tests:
      12. **isExpired - Future**: Should return false when token expires in the future
      13. **isExpired - Past**: Should return true when token has expired
      14. **isExpired - Exact**: Should return true when current time equals expiration
      15. **isExpired - Edge Cases**: Should handle edge cases around expiration time

    Integration Tests:
      16. **Real JWT Payload**: Should work with realistic JWT payload structure
      17. **Multiple Token Types**: Should validate different token behaviors consistently
      18. **Timestamp Conversion**: Should correctly convert seconds to milliseconds for expiration
*/

import { AuthToken } from "./auth-token.vo";

describe("AuthToken", () => {
  const baseProps = {
    sub: "user-123",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    jti: "token-123",
  };

  describe("Constructor", () => {
    it("TC001: Should create AuthToken with all required properties", () => {
      const props = {
        ...baseProps,
        type: "access" as const,
      };

      const token = new AuthToken(props);

      expect(token.sub).toBe("user-123");
      expect(token.iat).toBe(props.iat);
      expect(token.exp).toBe(props.exp);
      expect(token.jti).toBe("token-123");
      expect(token.type).toBe("access");
    });

    it("TC002: Should handle all valid token types", () => {
      const tokenTypes = ["access", "refresh", "email-confirmation", "password-recovery"] as const;

      tokenTypes.forEach(type => {
        const token = new AuthToken({
          ...baseProps,
          type,
        });

        expect(token.type).toBe(type);
      });
    });

    it("TC003: Should correctly assign all readonly properties", () => {
      const props = {
        sub: "test-user-456",
        iat: 1609459200,
        exp: 1609462800,
        jti: "unique-token-id",
        type: "refresh" as const,
      };

      const token = new AuthToken(props);

      expect(token.sub).toBe("test-user-456");
      expect(token.iat).toBe(1609459200);
      expect(token.exp).toBe(1609462800);
      expect(token.jti).toBe("unique-token-id");
      expect(token.type).toBe("refresh");
    });
  });

  describe("Authentication Validation", () => {
    it("TC004: Should return true for access tokens", () => {
      const token = new AuthToken({
        ...baseProps,
        type: "access",
      });

      expect(token.isValidForAuthentication()).toBe(true);
    });

    it("TC005: Should return false for refresh tokens", () => {
      const token = new AuthToken({
        ...baseProps,
        type: "refresh",
      });

      expect(token.isValidForAuthentication()).toBe(false);
    });

    it("TC006: Should return false for email-confirmation tokens", () => {
      const token = new AuthToken({
        ...baseProps,
        type: "email-confirmation",
      });

      expect(token.isValidForAuthentication()).toBe(false);
    });

    it("TC007: Should return false for password-recovery tokens", () => {
      const token = new AuthToken({
        ...baseProps,
        type: "password-recovery",
      });

      expect(token.isValidForAuthentication()).toBe(false);
    });
  });

  describe("Refresh Validation", () => {
    it("TC008: Should return false for access tokens", () => {
      const token = new AuthToken({
        ...baseProps,
        type: "access",
      });

      expect(token.isValidForRefresh()).toBe(false);
    });

    it("TC009: Should return true for refresh tokens", () => {
      const token = new AuthToken({
        ...baseProps,
        type: "refresh",
      });

      expect(token.isValidForRefresh()).toBe(true);
    });

    it("TC010: Should return false for email-confirmation tokens", () => {
      const token = new AuthToken({
        ...baseProps,
        type: "email-confirmation",
      });

      expect(token.isValidForRefresh()).toBe(false);
    });

    it("TC011: Should return false for password-recovery tokens", () => {
      const token = new AuthToken({
        ...baseProps,
        type: "password-recovery",
      });

      expect(token.isValidForRefresh()).toBe(false);
    });
  });

  describe("Expiration", () => {
    beforeAll(() => {
      jest.useFakeTimers();
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("TC012: Should return false when token expires in the future", () => {
      const currentTime = new Date("2023-01-01T00:00:00.000Z");
      jest.setSystemTime(currentTime);

      const token = new AuthToken({
        ...baseProps,
        exp: Math.floor(currentTime.getTime() / 1000) + 3600,
        type: "access",
      });

      expect(token.isExpired()).toBe(false);
    });

    it("TC013: Should return true when token has expired", () => {
      const currentTime = new Date("2023-01-01T00:00:00.000Z");
      jest.setSystemTime(currentTime);

      const token = new AuthToken({
        ...baseProps,
        exp: Math.floor(currentTime.getTime() / 1000) - 3600,
        type: "access",
      });

      expect(token.isExpired()).toBe(true);
    });

    it("TC014: Should return false when current time equals expiration", () => {
      const currentTime = new Date("2023-01-01T00:00:00.000Z");
      jest.setSystemTime(currentTime);

      const token = new AuthToken({
        ...baseProps,
        exp: Math.floor(currentTime.getTime() / 1000),
        type: "access",
      });

      expect(token.isExpired()).toBe(false);
    });

    it("TC015: Should handle edge cases around expiration time", () => {
      const currentTime = new Date("2023-01-01T00:00:00.000Z");
      const currentSeconds = Math.floor(currentTime.getTime() / 1000);

      const testCases = [
        { exp: currentSeconds + 1, expected: false, description: "1 second in future" },
        { exp: currentSeconds - 1, expected: true, description: "1 second in past" },
        {
          exp: currentSeconds + 0.5,
          expected: false,
          description: "0.5 seconds in future (rounded down)",
        },
      ];

      testCases.forEach(({ exp, expected }) => {
        jest.setSystemTime(currentTime);

        const token = new AuthToken({
          ...baseProps,
          exp: Math.floor(exp),
          type: "access",
        });

        expect(token.isExpired()).toBe(expected);
      });
    });
  });

  describe("Integration", () => {
    it("TC016: Should work with realistic JWT payload structure", () => {
      const jwtPayload = {
        sub: "auth0|507f1f77bcf86cd799439011",
        iat: 1609459200,
        exp: 1609462800,
        jti: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        type: "access" as const,
      };

      const token = new AuthToken(jwtPayload);

      expect(token.sub).toBe("auth0|507f1f77bcf86cd799439011");
      expect(token.jti).toBe("f47ac10b-58cc-4372-a567-0e02b2c3d479");
      expect(token.isValidForAuthentication()).toBe(true);
      expect(token.isValidForRefresh()).toBe(false);
    });

    it("TC017: Should validate different token behaviors consistently", () => {
      const tokenConfigs = [
        { type: "access" as const, validForAuth: true, validForRefresh: false },
        { type: "refresh" as const, validForAuth: false, validForRefresh: true },
        { type: "email-confirmation" as const, validForAuth: false, validForRefresh: false },
        { type: "password-recovery" as const, validForAuth: false, validForRefresh: false },
      ];

      tokenConfigs.forEach(({ type, validForAuth, validForRefresh }) => {
        const token = new AuthToken({
          ...baseProps,
          type,
        });

        expect(token.isValidForAuthentication()).toBe(validForAuth);
        expect(token.isValidForRefresh()).toBe(validForRefresh);
      });
    });

    it("TC018: Should correctly convert seconds to milliseconds for expiration", () => {
      jest.useFakeTimers();
      const currentTime = new Date("2023-01-01T00:00:00.000Z");
      jest.setSystemTime(currentTime);

      const currentSeconds = Math.floor(currentTime.getTime() / 1000);

      const testCases = [
        { expInSeconds: currentSeconds + 1800, shouldBeExpired: false },
        { expInSeconds: currentSeconds - 1800, shouldBeExpired: true },
        { expInSeconds: currentSeconds, shouldBeExpired: false },
      ];

      testCases.forEach(({ expInSeconds, shouldBeExpired }) => {
        const token = new AuthToken({
          ...baseProps,
          exp: expInSeconds,
          type: "access",
        });

        expect(token.isExpired()).toBe(shouldBeExpired);
      });

      jest.useRealTimers();
    });
  });
});
