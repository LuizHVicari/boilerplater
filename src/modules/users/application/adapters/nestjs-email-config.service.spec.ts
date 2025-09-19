/*
Test Cases for NestJSEmailConfigService:

Method Purpose: Provide email configuration values through NestJS config injection

1. **Happy Path**: Should return appName from config
2. **Happy Path**: Should return supportEmail from config
3. **Happy Path**: Should return baseUrl from config
4. **Happy Path**: Should return verificationPath from config
5. **Happy Path**: Should return resetPasswordPath from config
6. **Integration**: Should return all config values correctly
7. **Validation**: Should ensure all getters return string values
8. **Edge Case**: Should handle config injection correctly
*/

import type { ConfigType } from "@nestjs/config";

import emailConfig from "../../config/email.config";
import { EmailConfigService } from "../ports/email-config.service";
import { NestJSEmailConfigService } from "./nestjs-email-config.service";

describe("NestJSEmailConfigService", () => {
  let emailConfigService: EmailConfigService;
  let mockConfig: ConfigType<typeof emailConfig>;

  beforeEach(() => {
    mockConfig = {
      appName: "TestApp",
      supportEmail: "support@test.com",
      baseUrl: "https://test.com",
      verificationPath: "/verify-email",
      resetPasswordPath: "/reset-password",
    };

    emailConfigService = new NestJSEmailConfigService(mockConfig);
  });

  describe("Configuration Getters", () => {
    it("TC001: Should return appName from config", () => {
      // Act
      const appName = emailConfigService.appName;

      // Assert
      expect(appName).toBe("TestApp");
      expect(typeof appName).toBe("string");
    });

    it("TC002: Should return supportEmail from config", () => {
      // Act
      const supportEmail = emailConfigService.supportEmail;

      // Assert
      expect(supportEmail).toBe("support@test.com");
      expect(typeof supportEmail).toBe("string");
    });

    it("TC003: Should return baseUrl from config", () => {
      // Act
      const baseUrl = emailConfigService.baseUrl;

      // Assert
      expect(baseUrl).toBe("https://test.com");
      expect(typeof baseUrl).toBe("string");
    });

    it("TC004: Should return verificationPath from config", () => {
      // Act
      const verificationPath = emailConfigService.verificationPath;

      // Assert
      expect(verificationPath).toBe("/verify-email");
      expect(typeof verificationPath).toBe("string");
    });

    it("TC005: Should return resetPasswordPath from config", () => {
      // Act
      const resetPasswordPath = emailConfigService.resetPasswordPath;

      // Assert
      expect(resetPasswordPath).toBe("/reset-password");
      expect(typeof resetPasswordPath).toBe("string");
    });
  });

  describe("Integration", () => {
    it("TC006: Should return all config values correctly", () => {
      // Act & Assert
      expect(emailConfigService.appName).toBe(mockConfig.appName);
      expect(emailConfigService.supportEmail).toBe(mockConfig.supportEmail);
      expect(emailConfigService.baseUrl).toBe(mockConfig.baseUrl);
      expect(emailConfigService.verificationPath).toBe(mockConfig.verificationPath);
      expect(emailConfigService.resetPasswordPath).toBe(mockConfig.resetPasswordPath);
    });

    it("TC007: Should ensure all getters return string values", () => {
      // Act & Assert
      expect(typeof emailConfigService.appName).toBe("string");
      expect(typeof emailConfigService.supportEmail).toBe("string");
      expect(typeof emailConfigService.baseUrl).toBe("string");
      expect(typeof emailConfigService.verificationPath).toBe("string");
      expect(typeof emailConfigService.resetPasswordPath).toBe("string");
    });

    it("TC008: Should handle different config values", () => {
      // Arrange
      const differentConfig = {
        appName: "DifferentApp",
        supportEmail: "help@different.com",
        baseUrl: "https://different.com",
        verificationPath: "/email-verification",
        resetPasswordPath: "/password-reset",
      };
      const differentService = new NestJSEmailConfigService(differentConfig);

      // Act & Assert
      expect(differentService.appName).toBe("DifferentApp");
      expect(differentService.supportEmail).toBe("help@different.com");
      expect(differentService.baseUrl).toBe("https://different.com");
      expect(differentService.verificationPath).toBe("/email-verification");
      expect(differentService.resetPasswordPath).toBe("/password-reset");
    });
  });
});
