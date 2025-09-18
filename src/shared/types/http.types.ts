export interface HttpRequest {
  headers: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string>;
}

export interface AuthenticatedHttpRequest extends HttpRequest {
  user: {
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      active: boolean;
      emailConfirmed: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
    token: {
      sub: string;
      type: string;
      iat: number;
      exp: number;
      jti: string;
    };
  };
}

export interface HttpResponse {
  clearCookie(name: string, options?: Record<string, unknown>): void;
  cookie(name: string, value: string, options?: Record<string, unknown>): void;
}

export interface GraphQLContext {
  req: HttpRequest;
  res: HttpResponse;
}

export interface AuthenticatedGraphQLContext {
  req: AuthenticatedHttpRequest;
  res: HttpResponse;
}
