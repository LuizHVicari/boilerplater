import { registerAs } from "@nestjs/config";
import Joi from "joi";

const MIN_SECRET_LENGTH = 32;

const createJwtSchema = (): Joi.ObjectSchema => {
  return Joi.object({
    accessSecret: Joi.string().min(MIN_SECRET_LENGTH).required().messages({
      "string.empty": "JWT_ACCESS_SECRET cannot be empty",
      "string.min": "JWT_ACCESS_SECRET must be at least 32 characters long",
      "any.required": "JWT_ACCESS_SECRET is required",
    }),
    refreshSecret: Joi.string().min(MIN_SECRET_LENGTH).required().messages({
      "string.empty": "JWT_REFRESH_SECRET cannot be empty",
      "string.min": "JWT_REFRESH_SECRET must be at least 32 characters long",
      "any.required": "JWT_REFRESH_SECRET is required",
    }),
    emailVerificationSecret: Joi.string().min(MIN_SECRET_LENGTH).required().messages({
      "string.empty": "JWT_EMAIL_VERIFICATION_SECRET cannot be empty",
      "string.min": "JWT_EMAIL_VERIFICATION_SECRET must be at least 32 characters long",
      "any.required": "JWT_EMAIL_VERIFICATION_SECRET is required",
    }),
    passwordResetSecret: Joi.string().min(MIN_SECRET_LENGTH).required().messages({
      "string.empty": "JWT_PASSWORD_RESET_SECRET cannot be empty",
      "string.min": "JWT_PASSWORD_RESET_SECRET must be at least 32 characters long",
      "any.required": "JWT_PASSWORD_RESET_SECRET is required",
    }),
    accessTokenTtl: Joi.number().positive().integer().required().messages({
      "number.base": "JWT_ACCESS_TOKEN_TTL must be a number",
      "number.positive": "JWT_ACCESS_TOKEN_TTL must be positive",
      "number.integer": "JWT_ACCESS_TOKEN_TTL must be an integer",
      "any.required": "JWT_ACCESS_TOKEN_TTL is required",
    }),
    refreshTokenTtl: Joi.number().positive().integer().required().messages({
      "number.base": "JWT_REFRESH_TOKEN_TTL must be a number",
      "number.positive": "JWT_REFRESH_TOKEN_TTL must be positive",
      "number.integer": "JWT_REFRESH_TOKEN_TTL must be an integer",
      "any.required": "JWT_REFRESH_TOKEN_TTL is required",
    }),
    emailVerificationTokenTtl: Joi.number().positive().integer().required().messages({
      "number.base": "JWT_EMAIL_VERIFICATION_TOKEN_TTL must be a number",
      "number.positive": "JWT_EMAIL_VERIFICATION_TOKEN_TTL must be positive",
      "number.integer": "JWT_EMAIL_VERIFICATION_TOKEN_TTL must be an integer",
      "any.required": "JWT_EMAIL_VERIFICATION_TOKEN_TTL is required",
    }),
    passwordResetTokenTtl: Joi.number().positive().integer().required().messages({
      "number.base": "JWT_PASSWORD_RESET_TOKEN_TTL must be a number",
      "number.positive": "JWT_PASSWORD_RESET_TOKEN_TTL must be positive",
      "number.integer": "JWT_PASSWORD_RESET_TOKEN_TTL must be an integer",
      "any.required": "JWT_PASSWORD_RESET_TOKEN_TTL is required",
    }),
  });
};

export default registerAs("jwt", () => {
  const values = {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    emailVerificationSecret: process.env.JWT_EMAIL_VERIFICATION_SECRET,
    passwordResetSecret: process.env.JWT_PASSWORD_RESET_SECRET,
    accessTokenTtl: process.env.JWT_ACCESS_TOKEN_TTL,
    refreshTokenTtl: process.env.JWT_REFRESH_TOKEN_TTL,
    emailVerificationTokenTtl: process.env.JWT_EMAIL_VERIFICATION_TOKEN_TTL,
    passwordResetTokenTtl: process.env.JWT_PASSWORD_RESET_TOKEN_TTL,
  };

  const schema = createJwtSchema();

  const result = schema.validate(values, {
    convert: true,
    abortEarly: false,
  });

  if (result.error) {
    throw new Error(
      `JWT Configuration validation failed: ${result.error.details.map(detail => detail.message).join(", ")}`,
    );
  }

  return result.value as {
    accessSecret: string;
    refreshSecret: string;
    emailVerificationSecret: string;
    passwordResetSecret: string;
    accessTokenTtl: number;
    refreshTokenTtl: number;
    emailVerificationTokenTtl: number;
    passwordResetTokenTtl: number;
  };
});
