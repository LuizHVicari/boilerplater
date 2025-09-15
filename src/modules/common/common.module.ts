import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";

import { db, DB_TOKEN } from "../../db";
import { DrizzleUnitOfWork } from "./application/adapters/drizzle-unit-of-work.service";
import { NodeMailerEmailService } from "./application/adapters/node-mailer-email.service";
import { ValkeyCacheService } from "./application/adapters/valkey-cache.service";
import { CACHE_SERVICE } from "./application/ports/cache.service";
import { EMAIL_SERVICE } from "./application/ports/email.service";
import { UNIT_OF_WORK } from "./application/ports/unit-of-work.service";
import cacheConfig from "./config/cache.config";
import emailConfig from "./config/email.config";

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(cacheConfig),
    ConfigModule.forFeature(emailConfig),
    MailerModule.forRootAsync({
      imports: [ConfigModule.forFeature(emailConfig)],
      inject: [emailConfig.KEY],
      useFactory: (config: ConfigType<typeof emailConfig>) => {
        return {
          transport: {
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
              user: config.user,
              pass: config.password,
            },
          },
          defaults: {
            from: config.sender,
          },
          template: {
            dir: `${process.cwd()}/src/modules/common/templates`,
            adapter: new HandlebarsAdapter(),
            options: { strict: true },
          },
        };
      },
    }),
  ],
  providers: [
    {
      provide: DB_TOKEN,
      useValue: db,
    },
    {
      provide: UNIT_OF_WORK,
      useClass: DrizzleUnitOfWork,
    },
    {
      provide: CACHE_SERVICE,
      useClass: ValkeyCacheService,
    },
    {
      provide: EMAIL_SERVICE,
      useClass: NodeMailerEmailService,
    },
  ],
  exports: [DB_TOKEN, UNIT_OF_WORK, CACHE_SERVICE, EMAIL_SERVICE],
})
export class CommonModule {}
