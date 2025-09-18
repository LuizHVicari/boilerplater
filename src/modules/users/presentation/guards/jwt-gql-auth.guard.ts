import { ExecutionContext, Injectable } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import type { AuthenticatedHttpRequest } from "@shared/types/http.types";

import { JwtAuthGuard } from "./jwt-auth.guard";

@Injectable()
export class GqlJwtAuthGuard extends JwtAuthGuard {
  getRequest(context: ExecutionContext): AuthenticatedHttpRequest {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<{ req: AuthenticatedHttpRequest }>().req;
  }
}
