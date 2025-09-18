export interface HttpRequest {
  headers: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string>;
}

export interface HttpResponse {
  clearCookie(name: string, options?: Record<string, unknown>): void;
  cookie(name: string, value: string, options?: Record<string, unknown>): void;
}

export interface GraphQLContext {
  req: HttpRequest;
  res: HttpResponse;
}
