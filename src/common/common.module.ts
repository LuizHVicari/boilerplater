import { Global, Module } from "@nestjs/common";
import { db, DB_TOKEN } from "../db";
import { UNIT_OF_WORK } from "./application/ports/unit-of-work.service";
import { DrizzleUnitOfWork } from "./application/adapters/drizzle-unit-of-work.service";
import { ConfigModule } from "@nestjs/config";
import cacheConfig from "./config/cache.config";
import { CACHE_SERVICE } from "./application/ports/cache.service";
import { ValkeyCacheService } from "./application/adapters/valkey-cache.service";

@Global()
@Module({
  imports: [ConfigModule.forFeature(cacheConfig)],
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
  ],
  exports: [DB_TOKEN, UNIT_OF_WORK, CACHE_SERVICE],
})
export class CommonModule {}
