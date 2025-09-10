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
- **Authentication**: JWT tokens, bcrypt password hashing, multi-tenancy support
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
- Database URL and credentials configured via `.env`

### Code Quality Standards
- **ESLint + Prettier**: Enforces double quotes, 100 char line limit, trailing commas
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