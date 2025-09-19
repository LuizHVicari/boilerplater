/*
  Test Cases for BcryptPasswordService:

  Method Purpose: Hash and verify passwords using bcryptjs library

  1. **Happy Path**: Should hash password and return hashed string
  2. **Validation**: Should generate different hashes for same password (salt randomization)
  3. **Edge Case**: Should handle empty string password
  4. **Edge Case**: Should handle very long password strings
  5. **Happy Path**: Should return true when password matches hash
  6. **Negative**: Should return false when password doesn't match hash
  7. **Edge Case**: Should return false when comparing with invalid/malformed hash
  8. **Edge Case**: Should handle empty password against empty hash
  9. **Integration**: Should verify that hashed password can be successfully verified
  10. **Security**: Should use salt rounds of 10 (DEFAULT_SALT constant)
*/

import { PasswordService } from "../ports/password.service";
import { BcryptPasswordService } from "./bcrypt-password.service";

describe("BCryptPasswordService", () => {
  let passwordService: PasswordService;

  beforeAll(() => {
    passwordService = new BcryptPasswordService();
  });

  describe("Hash Password", () => {
    it("TC001: Should hash password and return hashed string", async () => {
      // Arrange
      const password = "password123";

      // Act
      const hashedPassword = await passwordService.hashPassword(password);

      // Assert
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toEqual(password);
      expect(hashedPassword.startsWith("$2b$10$")).toBeTruthy();
    });

    it("TC002: Should generate different hashes for same password (salt randomization)", async () => {
      // Arrange
      const password1 = "password123";

      // Act
      const hashedPassword1 = await passwordService.hashPassword(password1);
      const hashedPassword2 = await passwordService.hashPassword(password1);

      // Assert
      expect(hashedPassword1).not.toEqual(hashedPassword2);
    });

    it("TC003: Should handle empty string password", async () => {
      // Arrange
      const password = "";

      // Act
      const hashedPassword = await passwordService.hashPassword(password);

      // Assert
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toEqual(password);
    });

    it("TC004: Should handle very long password strings", async () => {
      // Arrange
      const password = "a".repeat(1000);

      // Act
      const hashedPassword = await passwordService.hashPassword(password);

      // Assert
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toEqual(password);
      expect(hashedPassword.startsWith("$2b$10$")).toBeTruthy();
    });
  });

  describe("Verify Password", () => {
    it("TC005: Should return true when password matches hash", async () => {
      // Arrange
      const password = "password123";
      const hashedPassword = await passwordService.hashPassword(password);

      // Act
      const isPasswordValid = await passwordService.verifyPassword(password, hashedPassword);

      // Assert
      expect(isPasswordValid).toBeTruthy();
    });

    it("TC006: Should return false when password doesn't match hash", async () => {
      // Arrange
      const password1 = "password123";
      const password2 = "password1234";
      const hashedPassword = await passwordService.hashPassword(password1);

      // Act
      const isPasswordValid = await passwordService.verifyPassword(password2, hashedPassword);

      // Assert
      expect(isPasswordValid).toBeFalsy();
    });

    it("TC007: Should return false when comparing with invalid/malformed hash", async () => {
      // Arrange
      const password = "password123";
      const malformedHash = "invalidHash";

      // Act & Assert
      expect(async () => {
        await passwordService.verifyPassword(password, malformedHash);
      }).not.toThrow();

      const result = await passwordService.verifyPassword(password, malformedHash);
      expect(result).toBeFalsy();
    });

    it("TC008: Should handle empty password against empty hash", async () => {
      // Arrange
      const password = "";
      const hashedPassword = "";

      // Act
      const isPasswordValid = await passwordService.verifyPassword(password, hashedPassword);

      // Assert
      expect(isPasswordValid).toBeFalsy();
    });

    it("TC009: Should handle empty password against valid hash", async () => {
      // Arrange
      const password = "";
      const hashedPassword = await passwordService.hashPassword("validPassword");

      // Act
      const isPasswordValid = await passwordService.verifyPassword(password, hashedPassword);

      // Assert
      expect(isPasswordValid).toBeFalsy();
    });
  });

  describe("Security", () => {
    it("TC010: Should use salt rounds of 10 (DEFAULT_SALT constant)", async () => {
      // Arrange
      const password = "password123";

      // Act
      const hashedPassword = await passwordService.hashPassword(password);

      // Assert
      expect(hashedPassword.startsWith("$2b$10$")).toBeTruthy();
    });
  });
});
