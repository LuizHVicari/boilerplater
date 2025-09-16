import { CommandBus } from "@nestjs/cqrs";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { ConfirmEmailCommand } from "@users/application/commands/confirm-email.command";
import { ResendEmailConfirmationCommand } from "@users/application/commands/resend-email-confirmation.command";
import { SignUpCommand } from "@users/application/commands/sign-up.command";

import { ConfirmEmailInput, ResendEmailConfirmationInput, SignUpInput } from "../dto/auth.input";
import {
  ConfirmEmailResponse,
  ResendEmailConfirmationResponse,
  SignUpResponse,
} from "../dto/auth.responses";

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

  @Mutation(() => ConfirmEmailResponse)
  async confirmEmail(@Args("input") input: ConfirmEmailInput): Promise<ConfirmEmailResponse> {
    const { id, email } = await this.commandBus.execute(new ConfirmEmailCommand(input.token));

    return {
      id,
      email,
    };
  }

  @Mutation(() => ResendEmailConfirmationResponse)
  async resendEmailConfirmation(
    @Args("input") input: ResendEmailConfirmationInput,
  ): Promise<ResendEmailConfirmationResponse> {
    const { email } = await this.commandBus.execute(
      new ResendEmailConfirmationCommand(input.email),
    );

    return {
      email,
    };
  }
}
