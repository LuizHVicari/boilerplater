import { registerAs } from "@nestjs/config";
import Joi from "joi";

export default registerAs("userEmail", () => {
  const values = {
    appName: process.env.USER_EMAIL_APP_NAME,
    supportEmail: process.env.USER_EMAIL_SUPPORT_EMAIL,
    baseUrl: process.env.USER_EMAIL_BASE_URL,
    verificationPath: process.env.USER_EMAIL_VERIFICATION_PATH,
    resetPasswordPath: process.env.USER_EMAIL_RESET_PASSWORD_PATH,
  };

  const schema = Joi.object({
    appName: Joi.string().required().messages({
      "string.empty": "USER_EMAIL_APP_NAME cannot be empty",
      "any.required": "USER_EMAIL_APP_NAME is required",
    }),
    supportEmail: Joi.string().email().required().messages({
      "string.email": "USER_EMAIL_SUPPORT_EMAIL must be a valid email address",
      "any.required": "USER_EMAIL_SUPPORT_EMAIL is required",
    }),
    baseUrl: Joi.string().uri().required().messages({
      "string.uri": "USER_EMAIL_BASE_URL must be a valid URL",
      "any.required": "USER_EMAIL_BASE_URL is required",
    }),
    verificationPath: Joi.string().required().messages({
      "string.empty": "USER_EMAIL_VERIFICATION_PATH cannot be empty",
      "any.required": "USER_EMAIL_VERIFICATION_PATH is required",
    }),
    resetPasswordPath: Joi.string().required().messages({
      "string.empty": "USER_EMAIL_RESET_PASSWORD_PATH cannot be empty",
      "any.required": "USER_EMAIL_RESET_PASSWORD_PATH is required",
    }),
  });

  const result = schema.validate(values, {
    convert: true,
    abortEarly: false,
  });

  if (result.error) {
    throw new Error(
      `User Email Configuration validation failed: ${result.error.details.map(detail => detail.message).join(", ")}`,
    );
  }

  return result.value as {
    appName: string;
    supportEmail: string;
    baseUrl: string;
    verificationPath: string;
    resetPasswordPath: string;
  };
});
