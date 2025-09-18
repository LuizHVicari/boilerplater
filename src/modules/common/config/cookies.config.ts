import { registerAs } from "@nestjs/config";
import Joi from "joi";

const createCookiesSchema = (): Joi.ObjectSchema => {
  return Joi.object({
    secure: Joi.boolean().required().messages({
      "boolean.base": "COOKIES_SECURE must be a boolean",
      "any.required": "COOKIES_SECURE is required",
    }),
    refreshTokenMaxAge: Joi.number().positive().integer().required().messages({
      "number.base": "REFRESH_TOKEN_MAX_AGE must be a number",
      "number.positive": "REFRESH_TOKEN_MAX_AGE must be positive",
      "number.integer": "REFRESH_TOKEN_MAX_AGE must be an integer",
      "any.required": "REFRESH_TOKEN_MAX_AGE is required",
    }),
  });
};

export default registerAs("cookies", () => {
  const values = {
    secure: process.env.COOKIES_SECURE === "true",
    refreshTokenMaxAge: process.env.REFRESH_TOKEN_MAX_AGE,
  };

  const schema = createCookiesSchema();

  const result = schema.validate(values, {
    convert: true,
    abortEarly: false,
  });

  if (result.error) {
    throw new Error(
      `Cookies Configuration validation failed: ${result.error.details.map(detail => detail.message).join(", ")}`,
    );
  }

  return result.value as {
    secure: boolean;
    refreshTokenMaxAge: number;
  };
});
