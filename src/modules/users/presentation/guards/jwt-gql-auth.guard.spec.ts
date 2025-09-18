/*
Test Cases for GqlJwtAuthGuard:

Guard Purpose: GraphQL-specific JWT authentication guard that extracts request from GraphQL execution context

1. **TC001 - getRequest()**: Should extract request from GraphQL execution context
2. **TC002 - Guard inheritance**: Should be instance of GqlJwtAuthGuard and override getRequest method properly
3. **TC003 - Error handling**: Should propagate errors from GraphQL context operations
*/

import { ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import type { AuthenticatedHttpRequest } from "@shared/types/http.types";

import { GqlJwtAuthGuard } from "./jwt-gql-auth.guard";

// Mock GqlExecutionContext
jest.mock("@nestjs/graphql", () => ({
  GqlExecutionContext: {
    create: jest.fn(),
  },
}));

describe("GqlJwtAuthGuard", () => {
  let guard: GqlJwtAuthGuard;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockGqlExecutionContext: jest.Mocked<any>;
  let mockRequest: AuthenticatedHttpRequest;

  beforeEach(() => {
    guard = new GqlJwtAuthGuard();

    mockRequest = {
      headers: {
        authorization: "Bearer token123",
      },
      cookies: {
        refreshToken: "refresh123",
      },
      user: {
        user: {
          id: "user-123",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          active: true,
          emailConfirmed: true,
          createdAt: new Date("2023-01-01"),
          updatedAt: new Date("2023-01-01"),
        },
        token: {
          sub: "user-123",
          type: "access",
          iat: 1640995200,
          exp: 1640998800,
          jti: "token-id-123",
        },
      },
    };

    mockGqlExecutionContext = {
      getContext: jest.fn().mockReturnValue({
        req: mockRequest,
      }),
    };

    mockExecutionContext = {
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getType: jest.fn(),
      switchToHttp: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as jest.Mocked<ExecutionContext>;

    (GqlExecutionContext.create as jest.Mock).mockReturnValue(mockGqlExecutionContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("TC001 - getRequest()", () => {
    it("should extract request from GraphQL execution context", () => {
      const result = guard.getRequest(mockExecutionContext);

      expect(GqlExecutionContext.create).toHaveBeenCalledWith(mockExecutionContext);
      expect(mockGqlExecutionContext.getContext).toHaveBeenCalled();
      expect(result).toBe(mockRequest);
    });

    it("should return authenticated request with user data", () => {
      const result = guard.getRequest(mockExecutionContext);

      expect(result.user).toBeDefined();
      expect(result.user.user.id).toBe("user-123");
      expect(result.user.user.email).toBe("test@example.com");
      expect(result.user.token.type).toBe("access");
    });

    it("should handle context with headers and cookies", () => {
      const result = guard.getRequest(mockExecutionContext);

      expect(result.headers.authorization).toBe("Bearer token123");
      expect(result.cookies?.refreshToken).toBe("refresh123");
    });
  });

  describe("TC002 - Guard inheritance", () => {
    it("should be instance of GqlJwtAuthGuard", () => {
      expect(guard).toBeInstanceOf(GqlJwtAuthGuard);
    });

    it("should override getRequest method properly", () => {
      expect(typeof guard.getRequest).toBe("function");
      expect(guard.getRequest.length).toBe(1);
    });
  });

  describe("TC003 - Error handling", () => {
    it("should propagate GqlExecutionContext.create errors", () => {
      const mockError = new Error("GraphQL context creation failed");
      const mockThrowingCreate = jest.fn().mockImplementation(() => {
        throw mockError;
      });
      (GqlExecutionContext.create as jest.Mock) = mockThrowingCreate;

      expect(() => guard.getRequest(mockExecutionContext)).toThrow(mockError);
    });

    it("should propagate getContext errors", () => {
      const mockError = new Error("Context access failed");
      const mockThrowingGetContext = jest.fn().mockImplementation(() => {
        throw mockError;
      });
      mockGqlExecutionContext.getContext = mockThrowingGetContext;

      expect(() => guard.getRequest(mockExecutionContext)).toThrow(mockError);
    });
  });
});
