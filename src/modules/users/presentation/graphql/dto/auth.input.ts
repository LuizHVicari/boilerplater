import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, IsJWT, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

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
