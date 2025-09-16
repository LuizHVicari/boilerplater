import { CommandBus } from "@nestjs/cqrs";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { SignUpCommand } from "@users/application/commands/sign-up.command";

import { SignUpResponse } from "../dto/auth.responses";
import { SignUpInput } from "../dto/sign-up.input";

@Resolver()
export class AuthResolver {
  constructor(private readonly commandBus: CommandBus) {}

  @Query(() => String)
  hello(): string {
    return "Hello World";
  }

  @Mutation(() => SignUpResponse)
  async signUp(@Args("input") input: SignUpInput): Promise<SignUpResponse> {
    const { id, email, firstName, lastName, createdAt, updatedAt } = await this.commandBus.execute(
      new SignUpCommand(input.email, input.password, input.firstName, input.lastName),
    );

    return {
      id,
      email,
      firstName,
      lastName,
      createdAt,
      updatedAt,
    };
  }
}
