/*
Test Cases for NodeMailerEmailService:
  Method Name: sendEmail
    Method Purpose: Send emails using NestJS MailerService wrapper

    1. **Happy Path**: Should send email verification email with correct parameters
    2. **Happy Path**: Should send reset password email with correct parameters
    3. **Verification**: Should call MailerService.sendMail with mapped parameters
    4. **Verification**: Should map email to 'to' field correctly
    5. **Verification**: Should pass subject, template, and context unchanged
    6. **Error**: Should propagate MailerService errors
    7. **Integration**: Should handle both email verification and reset password templates
    8. **Edge Case**: Should handle empty context objects
*/

import { MailerService } from "@nestjs-modules/mailer";

import { EmailService } from "../ports/email.service";
import { NodeMailerEmailService } from "./node-mailer-email.service";

describe("NodeMailerEmailService", () => {
  let emailService: EmailService;
  let mockMailerService: jest.Mocked<MailerService>;

  beforeEach(() => {
    mockMailerService = {
      sendMail: jest.fn(),
    } as any;

    emailService = new NodeMailerEmailService(mockMailerService);
  });

  describe("sendEmail", () => {
    it("TC001: Should send email verification email with correct parameters", async () => {
      // Arrange
      const emailProps = {
        email: "test@example.com",
        subject: "Verify your email",
        template: "email-verification" as const,
        context: {
          appName: "TestApp",
          userName: "John Doe",
          verificationUrl: "https://test.com/verify",
          expirationTime: "24 hours",
          supportEmail: "support@test.com",
        },
      };

      // Act
      await emailService.sendEmail(emailProps);

      // Assert
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: "test@example.com",
        subject: "Verify your email",
        template: "email-verification",
        context: {
          appName: "TestApp",
          userName: "John Doe",
          verificationUrl: "https://test.com/verify",
          expirationTime: "24 hours",
          supportEmail: "support@test.com",
        },
      });
    });

    it("TC002: Should send reset password email with correct parameters", async () => {
      // Arrange
      const emailProps = {
        email: "user@example.com",
        subject: "Reset your password",
        template: "reset-password" as const,
        context: {
          appName: "TestApp",
          userName: "Jane Smith",
          resetUrl: "https://test.com/reset",
          expirationTime: "1 hour",
          supportEmail: "support@test.com",
        },
      };

      // Act
      await emailService.sendEmail(emailProps);

      // Assert
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: "user@example.com",
        subject: "Reset your password",
        template: "reset-password",
        context: {
          appName: "TestApp",
          userName: "Jane Smith",
          resetUrl: "https://test.com/reset",
          expirationTime: "1 hour",
          supportEmail: "support@test.com",
        },
      });
    });

    it("TC003: Should call MailerService.sendMail with mapped parameters", async () => {
      // Arrange
      const emailProps = {
        email: "mapping@example.com",
        subject: "Test Subject",
        template: "email-verification" as const,
        context: {
          appName: "App",
          userName: "User",
          verificationUrl: "url",
          expirationTime: "time",
          supportEmail: "support",
        },
      };

      // Act
      await emailService.sendEmail(emailProps);

      // Assert
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "mapping@example.com",
          subject: "Test Subject",
          template: "email-verification",
          context: expect.any(Object),
        }),
      );
    });

    it("TC004: Should map email to 'to' field correctly", async () => {
      // Arrange
      const emailProps = {
        email: "specific@example.com",
        subject: "Test",
        template: "email-verification" as const,
        context: {
          appName: "App",
          userName: "User",
          verificationUrl: "url",
          expirationTime: "time",
          supportEmail: "support",
        },
      };

      // Act
      await emailService.sendEmail(emailProps);

      // Assert
      const callArgs = mockMailerService.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe("specific@example.com");
      expect(callArgs).not.toHaveProperty("email");
    });

    it("TC005: Should pass subject, template, and context unchanged", async () => {
      // Arrange
      const context = {
        appName: "TestApp",
        userName: "John",
        verificationUrl: "https://example.com",
        expirationTime: "24h",
        supportEmail: "support@example.com",
      };
      const emailProps = {
        email: "test@example.com",
        subject: "Original Subject",
        template: "email-verification" as const,
        context,
      };

      // Act
      await emailService.sendEmail(emailProps);

      // Assert
      const callArgs = mockMailerService.sendMail.mock.calls[0][0];
      expect(callArgs.subject).toBe("Original Subject");
      expect(callArgs.template).toBe("email-verification");
      expect(callArgs.context).toEqual(context);
      expect(callArgs.context).toBe(context);
    });

    it("TC006: Should propagate MailerService errors", async () => {
      // Arrange
      const error = new Error("SMTP connection failed");
      mockMailerService.sendMail.mockRejectedValue(error);
      const emailProps = {
        email: "error@example.com",
        subject: "Test",
        template: "email-verification" as const,
        context: {
          appName: "App",
          userName: "User",
          verificationUrl: "url",
          expirationTime: "time",
          supportEmail: "support",
        },
      };

      // Act & Assert
      await expect(emailService.sendEmail(emailProps)).rejects.toThrow("SMTP connection failed");
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe("Integration", () => {
    it("TC007: Should handle both email verification and reset password templates", async () => {
      // Arrange
      const verificationProps = {
        email: "verify@example.com",
        subject: "Verify Email",
        template: "email-verification" as const,
        context: {
          appName: "App",
          userName: "User1",
          verificationUrl: "verify-url",
          expirationTime: "24h",
          supportEmail: "support",
        },
      };

      const resetProps = {
        email: "reset@example.com",
        subject: "Reset Password",
        template: "reset-password" as const,
        context: {
          appName: "App",
          userName: "User2",
          resetUrl: "reset-url",
          expirationTime: "1h",
          supportEmail: "support",
        },
      };

      // Act
      await emailService.sendEmail(verificationProps);
      await emailService.sendEmail(resetProps);

      // Assert
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(2);
      expect(mockMailerService.sendMail).toHaveBeenNthCalledWith(1, {
        to: "verify@example.com",
        subject: "Verify Email",
        template: "email-verification",
        context: verificationProps.context,
      });
      expect(mockMailerService.sendMail).toHaveBeenNthCalledWith(2, {
        to: "reset@example.com",
        subject: "Reset Password",
        template: "reset-password",
        context: resetProps.context,
      });
    });
  });

  describe("Edge Case", () => {
    it("TC008: Should handle minimal context objects", async () => {
      // Arrange
      const emailProps = {
        email: "minimal@example.com",
        subject: "Minimal Test",
        template: "email-verification" as const,
        context: {
          appName: "",
          userName: "",
          verificationUrl: "",
          expirationTime: "",
          supportEmail: "",
        },
      };

      // Act
      await emailService.sendEmail(emailProps);

      // Assert
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: "minimal@example.com",
        subject: "Minimal Test",
        template: "email-verification",
        context: emailProps.context,
      });
    });
  });
});
