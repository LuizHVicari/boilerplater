export const EMAIL_CONFIG_SERVICE = Symbol("EMAIL_CONFIG_SERVICE");

export interface EmailConfigService {
  appName: string;
  supportEmail: string;
  baseUrl: string;
  verificationPath: string;
  resetPasswordPath: string;
}
