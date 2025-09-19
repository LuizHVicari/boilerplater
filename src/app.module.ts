import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { CqrsModule } from "@nestjs/cqrs";
import { GraphQLModule } from "@nestjs/graphql";
import { ThrottlerModule } from "@nestjs/throttler";
import { join } from "path";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CommonModule } from "./modules/common/common.module";
import { GqlThrottlerGuard } from "./modules/common/presentation/graphql/gql-throttler.guard";
import { UsersModule } from "./modules/users/users.module";
import { ONE_MINUTE_MILLISECONDS } from "./shared/constants/time-units.constants";

@Module({
  imports: [
    CqrsModule.forRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
      playground: true,
      context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
    }),
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: "default",
          ttl: ONE_MINUTE_MILLISECONDS,
          limit: 100,
        },
      ],
    }),
    UsersModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: GqlThrottlerGuard }],
})
export class AppModule {}
