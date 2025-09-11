import { registerAs } from "@nestjs/config";
import Joi from "joi";

export default registerAs("email", () => {
  const values = {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    secure: process.env.EMAIL_SECURE,
    sender: process.env.EMAIL_SENDER,
  };

  const schema = Joi.object({
    host: Joi.string().hostname().required().messages({
      "string.hostname": "EMAIL_HOST must be a valid hostname",
      "any.required": "EMAIL_HOST is required",
    }),
    port: Joi.number().port().required().messages({
      "number.base": "EMAIL_PORT must be a number",
      "number.port": "EMAIL_PORT must be a valid port number (1-65535)",
      "any.required": "EMAIL_PORT is required",
    }),
    user: Joi.string().email().required().messages({
      "string.email": "EMAIL_USER must be a valid email address",
      "any.required": "EMAIL_USER is required",
    }),
    password: Joi.string().required().messages({
      "string.empty": "EMAIL_PASSWORD cannot be empty",
      "any.required": "EMAIL_PASSWORD is required",
    }),
    secure: Joi.boolean().required().messages({
      "boolean.base": "EMAIL_SECURE must be true or false",
      "any.required": "EMAIL_SECURE is required",
    }),
    sender: Joi.string().email().required().messages({
      "string.email": "EMAIL_SENDER must be a valid email address",
      "any.required": "EMAIL_SENDER is required",
    }),
  });

  const result = schema.validate(values, {
    convert: true,
    abortEarly: false,
  });

  if (result.error) {
    throw new Error(
      `Email Configuration validation failed: ${result.error.details.map(detail => detail.message).join(", ")}`,
    );
  }

  return result.value as {
    host: string;
    port: number;
    user: string;
    password: string;
    secure: boolean;
    sender: string;
  };
});
