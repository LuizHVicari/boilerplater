import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";
import { GraphQLModule } from "@nestjs/graphql";
import { join } from "path";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CommonModule } from "./modules/common/common.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    CqrsModule.forRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
      playground: true,
    }),
    ConfigModule.forRoot(),
    UsersModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
