/*
  Test Cases for GqlThrottlerGuard:
    Context Extraction Tests:
      1. **Happy Path**: Should extract req and res from GraphQL context
      2. **Valid Context**: Should return proper request/response objects
      3. **Context Structure**: Should handle GraphQL execution context correctly

    Integration Tests:
      4. **GraphQL Integration**: Should work with GraphQL execution context
      5. **Request Mapping**: Should properly map GraphQL context to HTTP-like context
      6. **Error Handling**: Should handle malformed contexts gracefully
*/

import { ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { Test, TestingModule } from "@nestjs/testing";
import { ThrottlerModule } from "@nestjs/throttler";

import { GqlThrottlerGuard } from "./gql-throttler.guard";

describe("GqlThrottlerGuard", () => {
  let guard: GqlThrottlerGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: "default",
            ttl: 60000,
            limit: 10,
          },
        ]),
      ],
      providers: [GqlThrottlerGuard],
    }).compile();

    guard = module.get<GqlThrottlerGuard>(GqlThrottlerGuard);
  });

  describe("Context Extraction", () => {
    it("TC001: Should extract req and res from GraphQL context", () => {
      const mockReq = {
        ip: "127.0.0.1",
        headers: { "user-agent": "test-agent" },
        body: { query: "mutation signIn" },
      };
      const mockRes = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      };

      const mockGqlContext = {
        req: mockReq,
        res: mockRes,
      };

      const mockExecutionContext = {
        getType: jest.fn().mockReturnValue("graphql"),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(GqlExecutionContext, "create").mockReturnValue({
        getContext: () => mockGqlContext,
        getInfo: jest.fn(),
        getArgs: jest.fn(),
        getRoot: jest.fn(),
      } as any);

      const result = guard.getRequestResponse(mockExecutionContext);

      expect(result).toEqual({
        req: mockReq,
        res: mockRes,
      });
      expect(GqlExecutionContext.create).toHaveBeenCalledWith(mockExecutionContext);
    });

    it("TC002: Should return proper request/response objects", () => {
      const mockReq = {
        ip: "192.168.1.1",
        headers: {
          authorization: "Bearer token123",
          "content-type": "application/json",
        },
        cookies: { refreshToken: "refresh123" },
      };
      const mockRes = {
        status: jest.fn(),
        json: jest.fn(),
        cookie: jest.fn(),
      };

      const mockGqlContext = { req: mockReq, res: mockRes };
      const mockExecutionContext = {} as ExecutionContext;

      jest.spyOn(GqlExecutionContext, "create").mockReturnValue({
        getContext: () => mockGqlContext,
      } as any);

      const result = guard.getRequestResponse(mockExecutionContext);

      expect(result.req).toBe(mockReq);
      expect(result.res).toBe(mockRes);
      expect(result.req).toHaveProperty("ip", "192.168.1.1");
      expect(result.req).toHaveProperty("headers");
      expect(result.res).toHaveProperty("cookie");
    });

    it("TC003: Should handle GraphQL execution context correctly", () => {
      const mockContext = {
        req: { method: "POST", url: "/graphql" },
        res: { statusCode: 200 },
      };

      const mockExecutionContext = {
        switchToHttp: jest.fn(),
        getArgByIndex: jest.fn(),
        getArgs: jest.fn(),
        getType: jest.fn().mockReturnValue("graphql"),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      const mockGqlExecContext = {
        getContext: jest.fn().mockReturnValue(mockContext),
        getInfo: jest.fn(),
        getArgs: jest.fn(),
        getRoot: jest.fn(),
      };

      jest.spyOn(GqlExecutionContext, "create").mockReturnValue(mockGqlExecContext as any);

      const result = guard.getRequestResponse(mockExecutionContext);

      expect(GqlExecutionContext.create).toHaveBeenCalledWith(mockExecutionContext);
      expect(mockGqlExecContext.getContext).toHaveBeenCalled();
      expect(result).toEqual({
        req: mockContext.req,
        res: mockContext.res,
      });
    });
  });

  describe("Integration", () => {
    it("TC004: Should work with GraphQL execution context", () => {
      const mockGraphQLContext = {
        req: {
          ip: "10.0.0.1",
          headers: {
            "user-agent": "Apollo Client",
            authorization: "Bearer jwt-token",
          },
          body: {
            query: `
              mutation SignIn($input: SignInInput!) {
                signIn(input: $input) {
                  accessToken
                }
              }
            `,
            variables: { input: { email: "test@example.com", password: "password" } },
          },
        },
        res: {
          cookie: jest.fn(),
          clearCookie: jest.fn(),
          status: jest.fn(),
        },
      };

      const mockExecutionContext = {
        getType: () => "graphql",
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(GqlExecutionContext, "create").mockReturnValue({
        getContext: () => mockGraphQLContext,
      } as any);

      const result = guard.getRequestResponse(mockExecutionContext);

      expect(result.req).toEqual(mockGraphQLContext.req);
      expect(result.res).toEqual(mockGraphQLContext.res);
      expect(result.req).toHaveProperty("body.query");
      expect(result.req).toHaveProperty("body.variables");
    });

    it("TC005: Should properly map GraphQL context to HTTP-like context", () => {
      const originalReq = {
        protocol: "https",
        hostname: "api.example.com",
        ip: "203.0.113.1",
        headers: {
          "content-type": "application/json",
          "user-agent": "GraphQL Playground",
        },
      };

      const originalRes = {
        setHeader: jest.fn(),
        getHeader: jest.fn(),
        cookie: jest.fn(),
      };

      const gqlContext = { req: originalReq, res: originalRes };
      const execContext = {} as ExecutionContext;

      jest.spyOn(GqlExecutionContext, "create").mockReturnValue({
        getContext: () => gqlContext,
      } as any);

      const { req, res } = guard.getRequestResponse(execContext);

      expect(req).toBe(originalReq);
      expect(res).toBe(originalRes);

      expect(req).toHaveProperty("ip");
      expect(req).toHaveProperty("headers");
      expect(res).toHaveProperty("setHeader");
    });

    it("TC006: Should handle malformed contexts appropriately", () => {
      const mockExecutionContext = {} as ExecutionContext;

      jest.spyOn(GqlExecutionContext, "create").mockReturnValue({
        getContext: () => ({ req: { ip: "127.0.0.1" }, res: null }),
      } as any);

      const result = guard.getRequestResponse(mockExecutionContext);
      expect(result.req).toEqual({ ip: "127.0.0.1" });
      expect(result.res).toBeNull();

      jest.spyOn(GqlExecutionContext, "create").mockReturnValue({
        getContext: () => ({
          req: { headers: {} },
          res: { status: jest.fn() },
        }),
      } as any);

      const minimalResult = guard.getRequestResponse(mockExecutionContext);
      expect(minimalResult.req).toEqual({ headers: {} });
      expect(minimalResult.res).toEqual({ status: expect.any(Function) });
    });
  });
});
