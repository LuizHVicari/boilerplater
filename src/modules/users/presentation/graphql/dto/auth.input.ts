import { Field, InputType } from "@nestjs/graphql";
import { IsBoolean, IsEmail, IsJWT, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

@InputType()
export class SignUpInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;

  @Field({ nullable: true })
  @IsString()
  firstName?: string;

  @Field({ nullable: true })
  @IsString()
  lastName?: string;
}

@InputType()
export class ConfirmEmailInput {
  @Field()
  @IsJWT()
  @IsNotEmpty()
  token: string;
}

@InputType()
export class ResendEmailConfirmationInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

@InputType()
export class ForgotPasswordInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

@InputType()
export class ResetPasswordInput {
  @Field()
  @IsJWT()
  @IsNotEmpty()
  token: string;

  @Field()
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;
}

@InputType()
export class UpdatePasswordInput {
  @Field()
  @IsStrongPassword()
  @IsNotEmpty()
  currentPassword: string;

  @Field()
  @IsStrongPassword()
  @IsNotEmpty()
  newPassword: string;

  @Field({ defaultValue: false })
  @IsBoolean()
  invalidateSessions: boolean;
}
