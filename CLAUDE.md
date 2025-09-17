# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Boilerplater** is a comprehensive, production-ready **authentication/authorization microservice template** designed to eliminate the need to rebuild user management and authentication for every new project. This is a reusable microservice boilerplate that can be easily customized and deployed across different projects.

### Primary Objectives
- Provide complete authentication/authorization functionality out-of-the-box
- Support multiple communication protocols (GraphQL, REST, gRPC, AMQP)
- Implement enterprise-grade security standards (OWASP compliance)
- Maintain strict performance SLAs (authentication operations <200ms)
- Enable easy customization for different project requirements
- Enforce high code quality through automated tooling and specialized agents

## Development Commands

### Package Manager
This project uses `pnpm` as the package manager. All commands should use `pnpm` instead of `npm`.

### Core Development
```bash
# Install dependencies
pnpm install

# Development server (with watch mode)
pnpm run start:dev

# Production build and run
pnpm run build
pnpm run start:prod

# Type checking
pnpm run type-check
```

### Database Operations
```bash
# Start PostgreSQL via Docker
pnpm run db:start

# Generate migration from schema changes
pnpm run db:generate

# Run migrations
pnpm run db:migrate

# Push schema directly (development only)
pnpm run db:push

# Open Drizzle Studio (database GUI)
pnpm run db:studio

# Reset database (⚠️ destroys all data)
pnpm run db:reset
```

### Code Quality
```bash
# Check linting (with cache)
pnpm run lint

# Fix linting issues (with cache)
pnpm run lint:fix

# Run all tests
pnpm run test

# Run specific test file
pnpm run test -- user.service.spec.ts

# Run tests with coverage
pnpm run test:cov

# Run e2e tests
pnpm run test:e2e
```

## Architecture Overview

### Technology Stack
- **Framework**: NestJS with multi-protocol support
  - **GraphQL**: Apollo Server with auto-generated schema
  - **REST**: Traditional HTTP APIs
  - **gRPC**: High-performance RPC communication
  - **AMQP**: Message queue integration
- **Database**: PostgreSQL with Drizzle ORM (easily replaceable)
- **Architecture**: Clean Architecture / Hexagonal Architecture
- **Language**: TypeScript with strict ESLint + Prettier configuration
- **Authentication**: JWT tokens with Passport.js, bcrypt password hashing, multi-tenancy support
- **Validation**: Joi for environment variables with strict type checking and security requirements
- **Security**: OWASP Top 10 compliance, comprehensive security patterns

### Clean Architecture Structure
The codebase follows Clean Architecture principles with clear separation of concerns:

**Domain Layer** (`src/users/domain/`):
- Contains business entities and domain models (e.g., `UserModel`)
- Pure business logic with minimal dependencies (utility libraries allowed: uuid, crypto, date-fns, bcrypt)
- Domain models use private fields with getter methods and behavior methods
- No framework dependencies (NestJS, GraphQL, database libraries forbidden)

**Application Layer** (`src/users/application/`):
- **Ports**: Interfaces defining contracts (e.g., `UserCommandRepository`, `UserQueryRepository`)
- **Adapters**: Implementations of ports (e.g., `UserQueryDrizzleRepository`)
- Orchestrates business logic and handles use cases

**Infrastructure Layer**:
- **Database**: Drizzle schemas in `src/db/schema/`
- **GraphQL**: DTOs in `src/users/dto/` and entities in `src/users/entities/`
- **NestJS**: Resolvers, services, and modules for framework integration

### Key Architectural Patterns

**Unit of Work Pattern** (`src/common/`):
- `UnitOfWork` interface provides transactional operations
- `RepositoryContext` gives access to repositories within transactions
- `DrizzleUnitOfWorkService` implements database transactions

**Repository Pattern**:
- Command/Query separation (CQRS-like approach)
- `UserCommandRepository` for write operations
- `UserQueryRepository` for read operations
- Drizzle adapters implement these interfaces

**Domain Model Encapsulation**:
- Rich domain models with private state and public behavior
- Domain validation within constructors (e.g., password hashing validation)
- State changes through specific methods that update `updatedAt` timestamps

### Database Configuration
- Uses Drizzle ORM with PostgreSQL
- Schema files in `src/db/schema/`
- Migrations generated in `./drizzle/` directory
- Database URL and credentials configured via `.env` with Joi validation

### Environment Configuration
- **Joi Validation**: All environment variables validated at startup with strict type checking
- **Security Requirements**: JWT secrets must be minimum 32 characters, all required variables enforced
- **Type Safety**: Proper TypeScript types generated from validated environment variables
- **Clear Error Messages**: Detailed validation errors with specific requirements when configuration fails
- **No Default Values**: All required environment variables must be explicitly provided

### Code Quality Standards
- **ESLint + Prettier**: Enforces double quotes, 100 char line limit, trailing commas
- **Import Management**: Automatic import organization and unused import removal via eslint-plugin-simple-import-sort and eslint-plugin-unused-imports
- **Conventional Commits**: Required format `type: description` (feat, fix, docs, etc.)
- **Husky Pre-commit**: Runs type checking and linting before commits
- **TypeScript**: Strict configuration with explicit return types required

### GraphQL Schema
- Auto-generated schema file: `src/schema.gql`
- GraphQL playground enabled for development
- Uses NestJS GraphQL decorators for schema generation

### Testing Strategy
- Unit tests alongside source files (`.spec.ts`)
- E2E tests in `test/` directory
- Test commands support running specific files or with coverage
- **Structured Testing Workflow**: Uses specialized Claude agents for comprehensive test coverage:
  1. **Test Case Writer Agent**: Analyzes code and generates structured test case documentation
  2. **Test Implementation Agent**: Implements tests based on documented cases (must run AFTER Test Case Writer)

### Performance Requirements
- **Authentication Operations**: <200ms SLA (login, token validation, password verification)
- **Database Operations**: <100ms for user lookups, <50ms for ID-based queries
- **API Response Times**: GraphQL <200ms, REST <100ms, gRPC <50ms
- **Pagination**: OFFSET pagination is acceptable with reasonable limits (<100 per page, <1000 offset)

## Important Notes

### Domain Model Guidelines
- Domain models should encapsulate state with private fields
- Use getter methods for accessing state
- Behavior methods should update `updatedAt` when modifying state
- Validate business rules in constructors and methods

### Repository Implementation
- Always implement both command and query repository interfaces
- Use the Unit of Work pattern for transactional operations
- Map between domain models and database schemas using dedicated mappers

### Database Migrations
- Generate migrations after schema changes with `pnpm run db:generate`
- Use `pnpm run db:push` only for development (bypasses migrations)
- Always run migrations in production with `pnpm run db:migrate`

### Git Flow Workflow
This project follows a custom Git Flow with specific branch naming and targeting rules:

**Branch Types**:
- **main**: Production branch (protected)
- **dev**: Development integration branch (not "develop")
- **feat/[description]**: New features (e.g., `feat/jwt-refresh-tokens`)
- **bugfix/[description]**: Bug fixes (e.g., `bugfix/login-validation`)
- **hotfix/[description]**: Urgent production fixes (e.g., `hotfix/security-patch`)
- **release/[version]**: Release preparation (e.g., `release/v1.2.0`)

**Valid Branch Flows**:
- `feat/*` → `dev`
- `bugfix/*` → `dev`
- `dev` → `main`
- `hotfix/*` → `main` (emergency only)
- `release/*` → `main`

**Invalid Flows** (will be rejected):
- `feat/*` → `main` (must go through dev)
- Direct commits to main/dev
- Random branch naming not following conventions

### Commit Message Format
Required format enforced by commitlint:
- `feat: add user authentication`
- `fix: resolve login validation bug`
- `docs: update API documentation`
- Supported types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

## Specialized Claude Agents

This project includes specialized Claude agents (located in `.claude/agents/`) for maintaining code quality across different dimensions. These agents should be used proactively during development:

### 🧪 Testing Agents

**Test Case Writer Agent** (`.claude/agents/test-case-writer.md`):
- Analyzes code and generates structured test case documentation
- Creates comprehensive test plans with security, performance, and edge case scenarios
- Must be run BEFORE implementing tests

**Test Implementation Agent** (`.claude/agents/test-implementation.md`):
- Implements tests based on documented test cases
- Enforces prerequisite dependency on Test Case Writer Agent
- Focuses on practical test implementation with proper mocking and assertions

### 🔒 Security Agent

**Security Review Agent** (`.claude/agents/security-review.md`):
- Performs OWASP Top 10 compliance analysis
- Focuses on authentication/authorization vulnerabilities
- Reviews JWT implementation, password security, input validation
- Provides specific remediation steps for security issues

### 🏗️ Architecture Agent

**Architecture Compliance Agent** (`.claude/agents/architecture-compliance.md`):
- Validates Clean Architecture layer boundaries
- Enforces dependency direction rules (domain ← application ← infrastructure)
- Ensures domain layer purity (only utility libraries allowed)
- Validates port/adapter pattern implementation

### ⚡ Performance Agent

**Performance Analysis Agent** (`.claude/agents/performance-analysis.md`):
- Identifies performance bottlenecks and anti-patterns
- Enforces authentication SLA requirements (<200ms)
- Reviews database query patterns (N+1 detection, indexing)
- Analyzes caching strategies and connection pooling

### 📋 PR Management Agents

**PR Preparation Agent** (`.claude/agents/pr-preparation.md`):
- Guides comprehensive PR preparation workflow
- Validates branch naming and Git Flow compliance
- Removes unnecessary comments, adds docstrings when requested
- Runs quality gates before PR creation

**PR Review Agent** (`.claude/agents/pr-review.md`):
- Comprehensive GitHub PR review automation
- Validates Git Flow targeting rules
- Enforces security, architecture, and performance standards
- Provides structured feedback with specific remediation steps

### Agent Usage Guidelines
- **Proactive Usage**: Use agents throughout development, not just before PR submission
- **Sequential Dependencies**: Test Implementation Agent must run AFTER Test Case Writer Agent
- **Quality Gates**: Security and architecture agents have zero tolerance for violations
- **Documentation**: All agents provide structured, actionable feedback

## Code Style Guidelines

### Comments Policy
**NEVER add comments to code** unless they are docstrings and ONLY when explicitly requested by the user. The codebase should be self-documenting through:
- Clear variable and function names
- Well-structured code organization  
- Meaningful domain models and interfaces
- Proper separation of concerns

Code comments are considered code smell and indicate unclear implementation that should be refactored instead.

## Authentication Implementation Details

### JWT Token Service Implementation
The JWT token system is implemented with multiple secrets for different token types:

**Token Types and Secrets**:
- Access tokens: `JWT_ACCESS_SECRET` with configurable TTL
- Refresh tokens: `JWT_REFRESH_SECRET` with longer TTL
- Email verification: `JWT_EMAIL_VERIFICATION_SECRET` with 24h TTL
- Password reset: `JWT_PASSWORD_RESET_SECRET` with 1h TTL

**Token Generation** (`src/modules/users/application/adapters/jwt-token.service.ts`):
- Uses NestJS JwtService with `signAsync()` for proper async token generation
- Payload includes: `sub` (user ID), `email`, `type`, `iat`, `exp`, `jti`
- Different secrets and TTLs based on token type via `getTokenSecret()` and `getTokenTTL()`

**Token Verification**:
- Extracts token type from JWT payload rather than requiring external parameter
- Returns properly typed `AuthToken` domain object with validation

### Passport JWT Strategy
Authentication strategy located in application layer (`src/modules/users/application/strategies/jwt.strategy.ts`):

**Architecture Decision**: JwtStrategy belongs in application layer because:
- Contains business logic for token validation
- Orchestrates multiple domain and infrastructure services
- Not a pure infrastructure concern

**Validation Flow**:
1. Passport extracts JWT payload
2. Create `AuthToken` domain object from payload
3. Call `AuthValidationService` for comprehensive validation
4. Return validated user and token for request context

### Authentication Validation Service
Centralized validation logic (`src/modules/users/application/services/auth-validation.service.ts`):

**Responsibilities**:
- Token type validation (access/refresh tokens only for authentication)
- User existence and status verification
- Token revocation checks via `TokenInvalidationRepository`
- Domain rule enforcement (email confirmation, active status)

**Benefits**:
- Single source of truth for authentication validation
- Testable business logic separated from Passport framework
- Reusable across different authentication contexts

### Module Configuration
Complete NestJS module setup with proper dependency injection:

**Required Imports**:
- `CommonModule` for shared services (password, cache, email)
- `ConfigModule.forFeature(jwtConfig)` for JWT configuration
- `JwtModule.register({})` for NestJS JWT service
- `PassportModule` for authentication strategies

**Provider Registration**:
- Repository implementations with interface tokens
- Services with proper dependency injection
- Strategy registration for Passport integration

### Environment Variable Validation
Comprehensive Joi schemas in configuration files:

**JWT Configuration** (`src/modules/users/config/jwt.config.ts`):
- Minimum 32-character secrets for security
- Positive integer TTL values
- Custom error messages for each validation rule
- Type-safe return values with proper TypeScript types

**Cache Configuration** (`src/modules/common/config/cache.config.ts`):
- Hostname validation for cache server
- Port validation (1-65535 range)
- Optional password with empty string allowed

**Email Configuration** (`src/modules/common/config/email.config.ts`):
- SMTP hostname and port validation
- Email format validation for user and sender
- Boolean validation for secure connection flag

### ESLint Import Management
Automated code quality improvements via ESLint plugins:

**eslint-plugin-simple-import-sort**:
- Automatic import organization by type and alphabetical order
- Separate import and export rules
- Consistent import structure across codebase

**eslint-plugin-unused-imports**:
- Automatic removal of unused imports
- Prevents accumulation of dead import statements
- Improves bundle size and code clarity

### Key Implementation Patterns

**Domain Object Validation**:
```typescript
// AuthToken domain model validates token structure and business rules
const authToken = new AuthToken(payload);
if (!authToken.isValidForAuthentication()) {
  throw new UnauthorizedException("Invalid token type");
}
```

**Service Orchestration**:
```typescript
// Application service orchestrates domain and infrastructure concerns
async validateAuthToken(authToken: AuthToken): Promise<UserModel> {
  // Domain validation
  if (!authToken.isValidForAuthentication()) { /* ... */ }
  
  // Infrastructure calls
  const user = await this.userQueryRepo.findUserById(authToken.sub);
  await this.tokenInvalidationRepo.verifyTokenValid(authToken);
  
  // Domain business rules
  if (!user?.canAuthenticate()) { /* ... */ }
  
  return user;
}
```

**Configuration Validation Pattern**:
```typescript
// Joi schema validation with custom error messages
const schema = Joi.object({
  accessSecret: Joi.string().min(32).required().messages({
    "string.min": "JWT_ACCESS_SECRET must be at least 32 characters long",
    "any.required": "JWT_ACCESS_SECRET is required",
  }),
});

const result = schema.validate(values, { convert: true, abortEarly: false });
if (result.error) {
  throw new Error(`Configuration validation failed: ${result.error.details.map(d => d.message).join(", ")}`);
}
```

## CQRS Implementation

### Command Query Responsibility Segregation (CQRS)
The project implements CQRS pattern using NestJS CQRS package for clear separation of read and write operations:

**Global CQRS Configuration** (`src/app.module.ts`):
- `CqrsModule.forRoot()` registered globally for command/query bus access
- Enables dependency injection of CommandBus and QueryBus across modules

**Command Structure**:
- Commands extend base Command class with typed response
- Command handlers implement `ICommandHandler<TCommand>`
- Clear separation between command data and business logic
- Example: `SignUpCommand`, `ConfirmEmailCommand`, `ResendEmailConfirmationCommand`

**Command Handler Pattern**:
```typescript
@CommandHandler(SignUpCommand)
export class SignUpHandler implements ICommandHandler<SignUpCommand> {
  async execute(command: SignUpCommand): Promise<SignUpCommandResponse> {
    // Business logic implementation
    return response;
  }
}
```

**GraphQL Integration**:
- Resolvers use CommandBus to execute commands
- Explicit mapping between Command responses and GraphQL DTOs
- Separation of concerns maintained between layers

```typescript
@Mutation(() => SignUpResponse)
async signUp(@Args("input") input: SignUpInput): Promise<SignUpResponse> {
  const { id, email, firstName, lastName, createdAt, updatedAt } =
    await this.commandBus.execute(new SignUpCommand(input.email, input.password, input.firstName, input.lastName));

  return { id, email, firstName, lastName, createdAt, updatedAt };
}
```

## Domain Error Hierarchy

### Framework-Agnostic Error Handling
Implemented comprehensive domain error system that's independent of NestJS for protocol flexibility:

**Base Error Structure** (`src/shared/errors/`):
- `DomainError` abstract base class extending Error
- Generic error types: `EntityNotFoundError`, `ValidationError`, `InvalidTokenError`
- HTTP status constants to avoid magic numbers
- Domain-specific errors inherit from generic types

**User Domain Errors** (`src/modules/users/domain/errors/`):
- `UserNotFoundError extends EntityNotFoundError`
- `UserAlreadyExistsError extends EntityAlreadyExistsError`
- `EmailAlreadyConfirmedError extends AlreadyProcessedError`

**Exception Filter Integration**:
```typescript
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter, GqlExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void | DomainError {
    const contextType = host.getType<"http" | "graphql">();

    if (contextType === "graphql") {
      return this.handleGraphQLError(exception);
    }

    return this.handleHttpError(exception, host);
  }
}
```

**Benefits**:
- Protocol-agnostic error handling (HTTP, GraphQL, gRPC, AMQP)
- Consistent error responses across all communication layers
- Type-safe error handling with proper HTTP status codes
- Clean separation from framework dependencies

### Error Replacement Strategy
All generic `throw new Error()` calls replaced with typed domain errors:
- Command handlers use specific domain errors
- Infrastructure adapters use appropriate error types
- Domain models validate using `ValidationError`
- Token services use `InvalidTokenError` for type safety

## Authentication Flow Implementation

### Multi-Step Authentication Process
Complete implementation of secure authentication flows:

**SignUp Flow**:
1. Password hashing validation and user creation
2. Token invalidation for security (previous email-confirmation tokens)
3. New email confirmation token generation
4. Welcome email dispatch with verification link
5. Transactional consistency via UnitOfWork pattern

**Email Confirmation Flow**:
1. JWT token verification and type validation
2. Token invalidation status checking
3. User existence and email status validation
4. Email confirmation state update
5. Response with confirmed user data

**Resend Email Confirmation Flow**:
1. User lookup by email address
2. Validation of resend eligibility (exists + not confirmed)
3. Invalidation of existing email-confirmation tokens
4. New token generation with fresh expiration
5. Email dispatch with updated verification link

**Password Reset Flow**:
1. **Forgot Password**: User requests password reset via email
   - Silent failure for non-existent emails (security)
   - Invalidates all existing password-recovery tokens
   - Generates new password-recovery token
   - Sends email with reset link
2. **Reset Password**: User resets password using token from email
   - Validates token type (password-recovery only)
   - Checks token not invalidated
   - Verifies user active and email confirmed
   - Updates password with bcrypt hash
3. **Update Password**: Authenticated user changes password
   - Validates current password
   - Optional session invalidation (configurable)
   - Returns new access token + refresh token as secure cookie
   - Environment-based cookie configuration (COOKIES_SECURE, REFRESH_TOKEN_MAX_AGE)

### Security Best Practices
- Token invalidation before generating new tokens
- Type-safe token validation with domain objects
- Transactional operations for data consistency
- Comprehensive error handling with proper status codes
- Input validation using class-validator decorators
- Refresh tokens sent as HTTP-only cookies for XSS protection
- Configurable cookie security (secure flag) for different environments
- Silent failure for forgot password on non-existent emails

## Protocol-Agnostic Architecture

### Multi-Protocol Support Design
Architecture designed for easy addition of REST, gRPC, and AMQP:

**Application Layer Independence**:
- Command/Query handlers have no knowledge of communication protocols
- Domain errors work across all protocols via exception filters
- Business logic completely decoupled from presentation concerns

**Protocol Addition Strategy**:
```typescript
// REST Controller
@Controller('auth')
export class AuthController {
  @Post('signup')
  async signUp(@Body() dto: SignUpDto) {
    return this.commandBus.execute(new SignUpCommand(...dto));
  }
}

// gRPC Service
@GrpcMethod('AuthService', 'SignUp')
async signUp(data: SignUpRequest): Promise<SignUpResponse> {
  return this.commandBus.execute(new SignUpCommand(...data));
}

// AMQP Consumer
@EventPattern('auth.signup')
async handleSignUp(data: SignUpMessage) {
  await this.commandBus.execute(new SignUpCommand(...data));
}
```

**Scalability Considerations**:
- BullMQ integration recommended for email queuing (performance + reliability)
- Microservice extraction possible when scale demands it
- Clean boundaries enable independent deployment and scaling

## GraphQL Resolver Implementation

### Password Management Endpoints
Complete GraphQL mutations for password operations:

**Mutations Available**:
- `signUp`: User registration with email confirmation
- `confirmEmail`: Email verification using JWT token
- `resendEmailConfirmation`: Resend verification email
- `forgotPassword`: Request password reset link
- `resetPassword`: Reset password using token from email
- `updatePassword`: Change password for authenticated users

**Security Features**:
- Authentication required for `updatePassword` (extracts user from context)
- Refresh tokens returned as HTTP-only cookies
- Access tokens returned in GraphQL response
- Environment-based cookie configuration
- Input validation with class-validator decorators

**Cookie Configuration**:
- `COOKIES_SECURE`: Controls secure flag (false for dev, true for prod)
- `REFRESH_TOKEN_MAX_AGE`: TTL in milliseconds (default: 7 days)
- HTTP-only cookies prevent XSS attacks
- SameSite=strict for CSRF protection