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
