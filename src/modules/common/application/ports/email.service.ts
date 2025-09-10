export const EMAIL_SERVICE = Symbol("EMAIL_SERVICE");

export interface EmailVerificationContext {
  appName: string;
  userName: string;
  verificationUrl: string;
  expirationTime: string;
  supportEmail: string;
}

export interface ResetPasswordContext {
  appName: string;
  userName: string;
  resetUrl: string;
  expirationTime: string;
  supportEmail: string;
}

interface EmailVerificationProps {
  template: "email-verification";
  context: EmailVerificationContext;
}

interface ResetPasswordProps {
  template: "reset-password";
  context: ResetPasswordContext;
}

export type SendEmailProps = {
  email: string;
  subject: string;
} & (EmailVerificationProps | ResetPasswordProps);

export interface EmailService {
  sendEmail(props: SendEmailProps): Promise<void>;
}
