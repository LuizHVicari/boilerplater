import { ExecutionContext, Injectable } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { ThrottlerGuard } from "@nestjs/throttler";

interface GraphQLContextWithHttp {
  req?: {
    ip?: string;
    headers?: Record<string, string>;
    res?: Record<string, unknown>;
  };
  res?: Record<string, unknown>;
}

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext): {
    req: Record<string, unknown>;
    res: Record<string, unknown>;
  } {
    const reqType = context.getType<"http" | "graphql">();

    if (reqType === "graphql") {
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext<GraphQLContextWithHttp>();

      const req = ctx.req ?? { ip: "127.0.0.1", headers: {} };
      const res = ctx.res ?? ctx.req?.res ?? {};

      req.ip ??= "127.0.0.1";

      return { req, res };
    }

    return {
      req: context.switchToHttp().getRequest(),
      res: context.switchToHttp().getResponse(),
    };
  }
}
