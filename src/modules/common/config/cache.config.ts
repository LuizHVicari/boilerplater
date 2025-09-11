import { registerAs } from "@nestjs/config";
import Joi from "joi";

export default registerAs("cache", () => {
  const values = {
    host: process.env.CACHE_HOST,
    port: process.env.CACHE_PORT,
    password: process.env.CACHE_PASSWORD,
  };

  const schema = Joi.object({
    host: Joi.string().hostname().required().messages({
      "string.hostname": "CACHE_HOST must be a valid hostname",
      "any.required": "CACHE_HOST is required",
    }),
    port: Joi.number().port().required().messages({
      "number.base": "CACHE_PORT must be a number",
      "number.port": "CACHE_PORT must be a valid port number (1-65535)",
      "any.required": "CACHE_PORT is required",
    }),
    password: Joi.string().allow("").optional().messages({
      "string.base": "CACHE_PASSWORD must be a string",
    }),
  });

  const result = schema.validate(values, {
    convert: true,
    abortEarly: false,
  });

  if (result.error) {
    throw new Error(
      `Cache Configuration validation failed: ${result.error.details.map(detail => detail.message).join(", ")}`,
    );
  }

  return result.value as {
    host: string;
    port: number;
    password: string;
  };
});
