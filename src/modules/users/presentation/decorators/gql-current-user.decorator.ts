import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import type { AuthenticatedGraphQLContext } from "@shared/types/http.types";

export const GqlCurrentUser = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const ctx = GqlExecutionContext.create(context);
  const gqlContext = ctx.getContext<AuthenticatedGraphQLContext>();
  return gqlContext.req.user;
});
