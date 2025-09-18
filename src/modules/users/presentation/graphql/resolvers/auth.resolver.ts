import { CommandBus } from "@nestjs/cqrs";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import type { GraphQLContext } from "@shared/types/http.types";
import { clearRefreshTokenCookie, extractTokensFromContext } from "@shared/utils/token-extraction";
import { ConfirmEmailCommand } from "@users/application/commands/confirm-email.command";
import { ForgotPasswordCommand } from "@users/application/commands/forgot-password.command";
import { ResendEmailConfirmationCommand } from "@users/application/commands/resend-email-confirmation.command";
import { ResetPasswordCommand } from "@users/application/commands/reset-password.command";
import { SignInCommand } from "@users/application/commands/sign-in.command";
import { SignOutCommand } from "@users/application/commands/sign-out.command";
import { SignUpCommand } from "@users/application/commands/sign-up.command";
import { UpdatePasswordCommand } from "@users/application/commands/update-password.command";

import {
  ConfirmEmailInput,
  ForgotPasswordInput,
  ResendEmailConfirmationInput,
  ResetPasswordInput,
  SignInInput,
  SignUpInput,
  UpdatePasswordInput,
} from "../dto/auth.input";
import {
  ConfirmEmailResponse,
  ForgotPasswordResponse,
  ResendEmailConfirmationResponse,
  ResetPasswordResponse,
  SignInResponse,
  SignOutResponse,
  SignUpResponse,
  UpdatePasswordResponse,
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

  @Mutation(() => ForgotPasswordResponse)
  async forgotPassword(@Args("input") input: ForgotPasswordInput): Promise<ForgotPasswordResponse> {
    const { email } = await this.commandBus.execute(new ForgotPasswordCommand(input.email));

    return {
      email,
    };
  }

  @Mutation(() => ResetPasswordResponse)
  async resetPassword(@Args("input") input: ResetPasswordInput): Promise<ResetPasswordResponse> {
    const { email } = await this.commandBus.execute(
      new ResetPasswordCommand(input.token, input.password),
    );

    return {
      email,
    };
  }

  @Mutation(() => SignInResponse)
  async signIn(
    @Args("input") input: SignInInput,
    @Context() context: GraphQLContext,
  ): Promise<SignInResponse> {
    const { accessToken, refreshToken } = await this.commandBus.execute(
      new SignInCommand(input.email, input.password),
    );

    const isSecure = process.env.COOKIES_SECURE === "true";
    const maxAge = parseInt(process.env.REFRESH_TOKEN_MAX_AGE ?? "604800000", 10);

    context.res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "strict",
      maxAge,
    });

    return {
      accessToken,
    };
  }

  @Mutation(() => SignOutResponse)
  async signOut(@Context() context: GraphQLContext): Promise<SignOutResponse> {
    const { accessToken, refreshToken } = extractTokensFromContext(context);

    const { success } = await this.commandBus.execute(
      new SignOutCommand(accessToken, refreshToken),
    );

    clearRefreshTokenCookie(context);

    return { success };
  }

  @Mutation(() => UpdatePasswordResponse)
  async updatePassword(
    @Args("input") input: UpdatePasswordInput,
    @Context() context: GraphQLContext & { req: { user?: { id: string } } },
  ): Promise<UpdatePasswordResponse> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const { email, accessToken, refreshToken } = await this.commandBus.execute(
      new UpdatePasswordCommand(
        userId,
        input.currentPassword,
        input.newPassword,
        input.invalidateSessions,
      ),
    );

    const isSecure = process.env.COOKIES_SECURE === "true";
    const maxAge = parseInt(process.env.REFRESH_TOKEN_MAX_AGE ?? "604800000", 10);

    context.res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "strict",
      maxAge,
    });

    return {
      email,
      accessToken,
    };
  }
}
