import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { GqlExceptionFilter } from "@nestjs/graphql";
import { DomainError } from "@shared/errors/domain-error.base";
import { Response } from "express";

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter, GqlExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void | DomainError {
    const contextType = host.getType<"http" | "graphql">();

    if (contextType === "graphql") {
      return this.handleGraphQLError(exception);
    }

    return this.handleHttpError(exception, host);
  }

  private handleHttpError(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(exception.code).json({
      statusCode: exception.code,
      message: exception.message,
      error: HttpStatus[exception.code] || "Unknown Error",
    });
  }

  private handleGraphQLError(exception: DomainError): DomainError {
    return exception;
  }
}
