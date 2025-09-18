import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthenticatedHttpRequest } from "@shared/types/http.types";

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): AuthenticatedHttpRequest["user"] => {
    const request = context.switchToHttp().getRequest<AuthenticatedHttpRequest>();
    return request.user;
  },
);
