import { registerAs } from "@nestjs/config";

export default registerAs("cache", () => ({
  host: process.env.REDIS_HOST as string,
  port: +(process.env.REDIS_PORT ?? "6379"),
  password: process.env.REDIS_PASSWORD as string,
}));
