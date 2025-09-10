import { registerAs } from "@nestjs/config";

export default registerAs("jwt", () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET as string,
  refreshSecret: process.env.JWT_REFRESH_SECRET as string,
  emailVerificationSecret: process.env.JWT_EMAIL_VERIFICATION_SECRET as string,
  passwordResetSecret: process.env.JWT_PASSWORD_RESET_SECRET as string,
  accessTokenTtl: +(process.env.JWT_ACCESS_TOKEN_TTL as string),
  refreshTokenTtl: +(process.env.JWT_REFRESH_TOKEN_TTL as string),
  emailVerificationTokenTtl: +(process.env.JWT_EMAIL_VERIFICATION_TOKEN_TTL as string),
  passwordResetTokenTtl: +(process.env.JWT_PASSWORD_RESET_TOKEN_TTL as string),
}));
