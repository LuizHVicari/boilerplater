/*
Test Cases for DomainErrorFilter:

Method Purpose: Exception filter that converts DomainError instances to appropriate HTTP or GraphQL responses based on execution context

1. **Context Detection**: Should identify HTTP context and call handleHttpError when host.getType returns "http"
2. **Context Detection**: Should identify GraphQL context and call handleGraphQLError when host.getType returns "graphql"
3. **HTTP Error Handling**: Should return proper HTTP response with status code, message, and error name for HTTP context
4. **HTTP Error Handling**: Should handle unknown HTTP status codes gracefully with "Unknown Error" fallback
5. **GraphQL Error Handling**: Should return the exception directly for GraphQL context to let GraphQL format it
6. **HTTP Response Format**: Should format HTTP response with statusCode, message, and error properties matching NestJS conventions
7. **Status Code Mapping**: Should use exception.code as HTTP status code and map to HttpStatus enum for error name
8. **Method Delegation**: Should properly delegate to handleHttpError and handleGraphQLError private methods
*/

import { TestBed } from "@automock/jest";
import { ArgumentsHost } from "@nestjs/common";
import { GqlArgumentsHost } from "@nestjs/graphql";
import { DomainError } from "@shared/errors/domain-error.base";
import { EntityNotFoundError, ValidationError } from "@shared/errors/domain-errors";

import { DomainErrorFilter } from "./domain-error.filter";

class CustomDomainError extends DomainError {
  readonly code = 999;
  readonly message = "Custom error message";
}

describe("DomainErrorFilter", () => {
  let domainErrorFilter: DomainErrorFilter;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockHttpContext: any;
  let mockResponse: any;
  let mockGqlArgumentsHost: jest.Mocked<GqlArgumentsHost>;

  beforeEach(() => {
    const { unit } = TestBed.create(DomainErrorFilter).compile();
    domainErrorFilter = unit;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockHttpContext = {
      getResponse: jest.fn().mockReturnValue(mockResponse),
    };

    mockArgumentsHost = {
      getType: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue(mockHttpContext),
    } as unknown as jest.Mocked<ArgumentsHost>;

    mockGqlArgumentsHost = {
      create: jest.fn(),
    } as unknown as jest.Mocked<GqlArgumentsHost>;

    jest.spyOn(GqlArgumentsHost, "create").mockReturnValue(mockGqlArgumentsHost);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("TC001: Should identify HTTP context and call handleHttpError when host.getType returns 'http'", () => {
    it("should handle HTTP context correctly", () => {
      // Arrange
      const exception = new EntityNotFoundError();
      mockArgumentsHost.getType.mockReturnValue("http");

      // Act
      domainErrorFilter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockArgumentsHost.getType).toHaveBeenCalled();
      expect(mockArgumentsHost.switchToHttp).toHaveBeenCalled();
      expect(mockHttpContext.getResponse).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe("TC002: Should identify GraphQL context and call handleGraphQLError when host.getType returns 'graphql'", () => {
    it("should handle GraphQL context correctly", () => {
      // Arrange
      const exception = new ValidationError();
      mockArgumentsHost.getType.mockReturnValue("graphql");

      // Act
      const result = domainErrorFilter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockArgumentsHost.getType).toHaveBeenCalled();
      expect(result).toBe(exception);
      expect(mockArgumentsHost.switchToHttp).not.toHaveBeenCalled();
    });
  });

  describe("TC003: Should return proper HTTP response with status code, message, and error name for HTTP context", () => {
    it("should format HTTP response correctly for EntityNotFoundError", () => {
      // Arrange
      const exception = new EntityNotFoundError();
      mockArgumentsHost.getType.mockReturnValue("http");

      // Act
      domainErrorFilter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 404,
        message: "Entity not found",
        error: "NOT_FOUND",
      });
    });

    it("should format HTTP response correctly for ValidationError", () => {
      // Arrange
      const exception = new ValidationError();
      mockArgumentsHost.getType.mockReturnValue("http");

      // Act
      domainErrorFilter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: "Validation failed",
        error: "BAD_REQUEST",
      });
    });
  });

  describe("TC004: Should handle unknown HTTP status codes gracefully with 'Unknown Error' fallback", () => {
    it("should use 'Unknown Error' for non-standard status codes", () => {
      // Arrange
      const exception = new CustomDomainError();
      mockArgumentsHost.getType.mockReturnValue("http");

      // Act
      domainErrorFilter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(999);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 999,
        message: "Custom error message",
        error: "Unknown Error",
      });
    });
  });

  describe("TC005: Should return the exception directly for GraphQL context to let GraphQL format it", () => {
    it("should return exception object for GraphQL processing", () => {
      // Arrange
      const exception = new EntityNotFoundError();
      mockArgumentsHost.getType.mockReturnValue("graphql");

      // Act
      const result = domainErrorFilter.catch(exception, mockArgumentsHost);

      // Assert
      expect(result).toBe(exception);
      expect(result).toBeInstanceOf(EntityNotFoundError);
      if (result instanceof DomainError) {
        expect(result.code).toBe(404);
        expect(result.message).toBe("Entity not found");
      }
    });
  });

  describe("TC006: Should format HTTP response with statusCode, message, and error properties matching NestJS conventions", () => {
    it("should use consistent response format matching NestJS ExceptionFilter conventions", () => {
      // Arrange
      const exception = new ValidationError();
      mockArgumentsHost.getType.mockReturnValue("http");

      // Act
      domainErrorFilter.catch(exception, mockArgumentsHost);

      // Assert
      const responseCall = mockResponse.json.mock.calls[0][0];
      expect(responseCall).toHaveProperty("statusCode");
      expect(responseCall).toHaveProperty("message");
      expect(responseCall).toHaveProperty("error");
      expect(typeof responseCall.statusCode).toBe("number");
      expect(typeof responseCall.message).toBe("string");
      expect(typeof responseCall.error).toBe("string");
    });
  });

  describe("TC007: Should use exception.code as HTTP status code and map to HttpStatus enum for error name", () => {
    it("should correctly map 404 status code for EntityNotFoundError", () => {
      const exception = new EntityNotFoundError();
      mockArgumentsHost.getType.mockReturnValue("http");

      domainErrorFilter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 404,
        message: exception.message,
        error: "NOT_FOUND",
      });
    });

    it("should correctly map 400 status code for ValidationError", () => {
      const exception = new ValidationError();
      mockArgumentsHost.getType.mockReturnValue("http");

      domainErrorFilter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: exception.message,
        error: "BAD_REQUEST",
      });
    });
  });

  describe("TC008: Should properly delegate to handleHttpError and handleGraphQLError private methods", () => {
    it("should delegate to correct handler based on context type", () => {
      // Arrange
      const exception = new EntityNotFoundError();

      mockArgumentsHost.getType.mockReturnValue("http");
      jest.clearAllMocks();

      // Act
      domainErrorFilter.catch(exception, mockArgumentsHost);

      expect(mockArgumentsHost.switchToHttp).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalled();

      mockArgumentsHost.getType.mockReturnValue("graphql");
      jest.clearAllMocks();

      // Act
      const result = domainErrorFilter.catch(exception, mockArgumentsHost);

      expect(result).toBe(exception);
      expect(mockArgumentsHost.switchToHttp).not.toHaveBeenCalled();
    });
  });
});
