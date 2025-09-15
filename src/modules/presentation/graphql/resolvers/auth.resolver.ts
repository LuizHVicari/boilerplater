import { Inject } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import {
  SIGN_UP_USE_CASE,
  type SignUpUseCase,
} from "src/modules/users/application/use-cases/auth.use-cases";

import { SignUpResponse } from "../dto/auth.responses";
import { SignUpInput } from "../dto/sign-up.input";

@Resolver()
export class AuthResolver {
  constructor(
    @Inject(SIGN_UP_USE_CASE)
    private readonly signUpUseCase: SignUpUseCase,
  ) {}

  @Query(() => String)
  hello(): string {
    return "Hello World";
  }

  @Mutation(() => SignUpResponse)
  async signUp(@Args("input") input: SignUpInput): Promise<SignUpResponse> {
    return this.signUpUseCase.signUp(input);
  }
}
