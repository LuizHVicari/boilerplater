import cookiesConfig from "@common/config/cookies.config";
import { Inject, UseGuards } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import { CommandBus } from "@nestjs/cqrs";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Throttle } from "@nestjs/throttler";
import type { AuthenticatedGraphQLContext, GraphQLContext } from "@shared/types/http.types";
import { clearRefreshTokenCookie, extractTokensFromContext } from "@shared/utils/token-extraction";
import { ConfirmEmailCommand } from "@users/application/commands/confirm-email.command";
import { ForgotPasswordCommand } from "@users/application/commands/forgot-password.command";
import { RefreshTokenCommand } from "@users/application/commands/refresh-token.command";
import { ResendEmailConfirmationCommand } from "@users/application/commands/resend-email-confirmation.command";
import { ResetPasswordCommand } from "@users/application/commands/reset-password.command";
import { SignInCommand } from "@users/application/commands/sign-in.command";
import { SignOutCommand } from "@users/application/commands/sign-out.command";
import { SignUpCommand } from "@users/application/commands/sign-up.command";
import { UpdatePasswordCommand } from "@users/application/commands/update-password.command";
import { GqlThrottlerGuard } from "src/modules/common/presentation/graphql/gql-throttler.guard";

import { GqlCurrentUser } from "../../decorators/gql-current-user.decorator";
import { GqlJwtAuthGuard } from "../../guards/jwt-gql-auth.guard";
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
  MeResponse,
  RefreshTokenResponse,
  ResendEmailConfirmationResponse,
  ResetPasswordResponse,
  SignInResponse,
  SignOutResponse,
  SignUpResponse,
  UpdatePasswordResponse,
} from "../dto/auth.responses";

@Resolver()
export class AuthResolver {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject(cookiesConfig.KEY)
    private readonly cookiesSettings: ConfigType<typeof cookiesConfig>,
  ) {}

  @Query(() => String)
  hello(): string {
    return "Hello World";
  }

  @Query(() => MeResponse)
  @UseGuards(GqlJwtAuthGuard)
  me(@GqlCurrentUser() currentUser: AuthenticatedGraphQLContext["req"]["user"]): MeResponse {
    const { user } = currentUser;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      active: user.active,
      emailConfirmed: user.emailConfirmed,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Mutation(() => SignUpResponse)
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 2, ttl: 60000 } }) // 2 signups per minute
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
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 2, ttl: 60000 } })
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
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 forgot password attempts per 5 minutes
  async forgotPassword(@Args("input") input: ForgotPasswordInput): Promise<ForgotPasswordResponse> {
    const { email } = await this.commandBus.execute(new ForgotPasswordCommand(input.email));

    return {
      email,
    };
  }

  @Mutation(() => ResetPasswordResponse)
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 reset attempts per minute
  async resetPassword(@Args("input") input: ResetPasswordInput): Promise<ResetPasswordResponse> {
    const { email } = await this.commandBus.execute(
      new ResetPasswordCommand(input.token, input.password),
    );

    return {
      email,
    };
  }

  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 login attempts per 5 minutes - MOST RESTRICTIVE
  @Mutation(() => SignInResponse)
  async signIn(
    @Args("input") input: SignInInput,
    @Context() context: GraphQLContext,
  ): Promise<SignInResponse> {
    const { accessToken, refreshToken } = await this.commandBus.execute(
      new SignInCommand(input.email, input.password),
    );

    const isSecure = this.cookiesSettings.secure;
    const maxAge = this.cookiesSettings.refreshTokenMaxAge;

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

  @Mutation(() => RefreshTokenResponse)
  async refreshToken(@Context() context: GraphQLContext): Promise<RefreshTokenResponse> {
    const { refreshToken } = extractTokensFromContext(context);

    const { accessToken } = await this.commandBus.execute(new RefreshTokenCommand(refreshToken));

    return { accessToken };
  }

  @Mutation(() => UpdatePasswordResponse)
  @UseGuards(GqlJwtAuthGuard)
  async updatePassword(
    @Args("input") input: UpdatePasswordInput,
    @GqlCurrentUser() currentUser: AuthenticatedGraphQLContext["req"]["user"],
    @Context() context: GraphQLContext,
  ): Promise<UpdatePasswordResponse> {
    const userId = currentUser.user.id;

    const { email, accessToken, refreshToken } = await this.commandBus.execute(
      new UpdatePasswordCommand(
        userId,
        input.currentPassword,
        input.newPassword,
        input.invalidateSessions,
      ),
    );

    const isSecure = this.cookiesSettings.secure;
    const maxAge = this.cookiesSettings.refreshTokenMaxAge;

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
