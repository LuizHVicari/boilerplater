import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          imgSrc: ["'self'", "data:", "apollo-server-landing-page.cdn.apollographql.com"],
          scriptSrc: ["'self'", "https: 'unsafe-inline'"],
          manifestSrc: ["'self'", "apollo-server-landing-page.cdn.apollographql.com"],
          frameSrc: ["'self'", "sandbox.embed.apollographql.com"],
        },
      },
    }),
  );

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validateCustomDecorators: true,
      forbidUnknownValues: true,
      skipMissingProperties: true,
      skipNullProperties: true,
      skipUndefinedProperties: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
