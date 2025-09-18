import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class SignUpResponse {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class ConfirmEmailResponse {
  @Field()
  id: string;

  @Field()
  email: string;
}

@ObjectType()
export class ResendEmailConfirmationResponse {
  @Field()
  email: string;
}

@ObjectType()
export class ForgotPasswordResponse {
  @Field()
  email: string;
}

@ObjectType()
export class ResetPasswordResponse {
  @Field()
  email: string;
}

@ObjectType()
export class SignInResponse {
  @Field()
  accessToken: string;
}

@ObjectType()
export class SignOutResponse {
  @Field()
  success: boolean;
}

@ObjectType()
export class UpdatePasswordResponse {
  @Field()
  email: string;

  @Field()
  accessToken: string;
}
