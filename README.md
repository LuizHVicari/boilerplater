# Boilerplater

A comprehensive **authentication/authorization microservice template** built with NestJS, implementing Clean Architecture with multi-protocol support, designed for reusability across projects.

## Overview

**Boilerplater** eliminates the need to rebuild user management and authentication for every new project. This template provides a structured foundation for authentication/authorization microservices with established patterns and comprehensive tooling.

## Features

- 🏗️ **Clean Architecture** - Domain-driven design with clear separation of concerns
- 🔌 **Multi-Protocol Support** - Designed for GraphQL, REST, gRPC, and AMQP
- 🗄️ **PostgreSQL + Drizzle ORM** - Type-safe database operations with migrations
- 🔒 **Authentication Patterns** - JWT, bcrypt, multi-tenancy foundation
- 🛡️ **Security Focus** - OWASP Top 10 compliance guidelines and review processes
- 🛠️ **Development Tooling** - ESLint, Prettier, Husky, Conventional Commits
- 🐳 **Docker Ready** - Containerized PostgreSQL setup with Docker Compose
- 📊 **Database Management** - Drizzle Studio, migrations, and schema management
- 🤖 **Claude Agents** - Specialized agents for security, architecture, performance, and testing
- ✅ **Testing Framework** - Structured testing workflow with specialized agents
- 🔄 **Git Flow** - Custom workflow with branch naming and targeting rules

## Tech Stack

- **Backend**: NestJS, TypeScript
- **Protocols**: GraphQL (Apollo Server), REST, gRPC, AMQP
- **Database**: PostgreSQL with Drizzle ORM (easily replaceable)
- **Authentication**: JWT tokens, bcrypt password hashing
- **Validation**: Joi for environment variables, Class Validator & Transformer for DTOs
- **Testing**: Jest with structured testing workflow
- **Code Quality**: ESLint, Prettier, Husky, Conventional Commits
- **Development**: Docker, Hot Reload, Specialized Claude Agents

## Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm
- Docker (for PostgreSQL)

### Installation

```bash
# Clone the repository
git clone https://github.com/LuizHVicari/boilerplater.git
cd boilerplater

# Install dependencies
pnpm install

# Start PostgreSQL
pnpm run db:start

# Run database migrations
pnpm run db:migrate

# Start development server
pnpm run start:dev
```

The GraphQL playground will be available at `http://localhost:3000/graphql`

## Development

### Available Scripts

```bash
# Development
pnpm run start:dev          # Start with hot reload
pnpm run start:debug        # Start in debug mode

# Database
pnpm run db:start           # Start PostgreSQL via Docker
pnpm run db:generate        # Generate migrations from schema
pnpm run db:migrate         # Run pending migrations
pnpm run db:push            # Push schema directly (dev only)
pnpm run db:studio          # Open Drizzle Studio
pnpm run db:reset           # Reset database (destroys data)

# Code Quality
pnpm run lint               # Check linting
pnpm run lint:fix           # Fix linting issues
pnpm run type-check         # TypeScript type checking

# Testing
pnpm run test               # Run unit tests
pnpm run test:watch         # Run tests in watch mode
pnpm run test:cov           # Run tests with coverage
pnpm run test:e2e           # Run e2e tests
```

### Docker Commands

```bash
# Start all services
pnpm run docker:up

# View database logs
pnpm run docker:logs

# Stop all services
pnpm run docker:down
```

## Architecture

### Clean Architecture Structure

The codebase follows Clean Architecture principles with clear layer separation:

- **Domain Layer**: Contains business entities and domain models with pure business logic
- **Application Layer**: Orchestrates business logic through ports (interfaces) and adapters (implementations)
- **Infrastructure Layer**: Handles external concerns like database schemas and GraphQL definitions
- **Common**: Shared application logic and cross-cutting concerns

### Key Patterns

- **Unit of Work**: Transactional operations across repositories
- **Repository Pattern**: Separated command/query responsibilities
- **Domain Models**: Rich objects with encapsulated business logic
- **Dependency Injection**: NestJS IoC container for loose coupling

## Database

### Schema Management

The project uses Drizzle ORM for type-safe database operations:

```bash
# After modifying schema files
pnpm run db:generate        # Create migration files
pnpm run db:migrate         # Apply migrations to database

# For development iterations
pnpm run db:push            # Direct schema sync (skips migrations)
```

### Database Studio

Access the visual database editor:

```bash
pnpm run db:studio
```

## Code Quality & Development Standards

### Comments Policy

**STRICT NO-COMMENTS POLICY**: Never add comments to code unless they are docstrings and only when explicitly requested. Code should be self-documenting through:
- Clear variable and function names
- Well-structured code organization
- Meaningful domain models and interfaces
- Proper separation of concerns

### Git Flow Workflow

This project follows a custom Git Flow with specific branch naming and targeting rules:

**Branch Types**:
- **main**: Production branch (protected)
- **dev**: Development integration branch
- **feat/[description]**: New features → targets `dev`
- **bugfix/[description]**: Bug fixes → targets `dev`
- **hotfix/[description]**: Urgent production fixes → targets `main`
- **release/[version]**: Release preparation → targets `main`

**Examples**:
- `feat/jwt-refresh-tokens`
- `bugfix/login-validation`
- `hotfix/security-patch`

### Performance Targets

The template is designed with specific performance goals:
- **Authentication Operations**: Target <200ms (login, token validation, password verification)
- **Database Operations**: Target <100ms for user lookups
- **Pagination**: OFFSET pagination acceptable with reasonable limits (<100 per page)

### Security Standards

- **OWASP Top 10 Compliance**: Built-in guidelines and review processes
- **JWT Security**: Proper signing, expiration, secret management patterns
- **Password Security**: bcrypt with appropriate cost factors
- **Input Validation**: Comprehensive sanitization patterns

### Pre-commit Hooks

Husky automatically runs checks before commits:
- TypeScript type checking
- ESLint linting (with cache for performance)
- Conventional commit message validation

### Commit Message Format

Follow conventional commit format:
```
type: description

# Examples:
feat: add user authentication
fix: resolve login validation bug
docs: update API documentation
```

Supported types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

## Specialized Claude Agents

This template includes specialized Claude agents (`.claude/agents/`) for maintaining code quality:

### 🧪 Testing Agents
- **Test Case Writer**: Analyzes code and generates structured test case documentation
- **Test Implementation**: Implements tests based on documented cases (runs AFTER Test Case Writer)

### 🔒 Security & Architecture
- **Security Review**: OWASP Top 10 compliance analysis and vulnerability detection
- **Architecture Compliance**: Clean Architecture validation and layer boundary enforcement

### ⚡ Performance & PR Management
- **Performance Analysis**: Bottleneck identification and SLA enforcement
- **PR Preparation**: Pre-PR quality checks and Git Flow validation
- **PR Review**: Comprehensive GitHub PR review with structured feedback

### Usage Guidelines
- Use agents proactively throughout development
- Test Implementation Agent requires Test Case Writer to run first
- Security and architecture agents have zero tolerance for violations

## Testing

### Structured Testing Workflow

This template implements a structured testing approach using specialized agents:

1. **Test Case Writer Agent**: First, analyze code and document test cases
2. **Test Implementation Agent**: Then, implement tests based on documented cases

### Running Tests

```bash
# Unit tests
pnpm run test

# Specific test file
pnpm run test -- user.service.spec.ts

# With coverage
pnpm run test:cov

# E2E tests
pnpm run test:e2e
```

## Environment Variables

Configure your environment by creating a `.env` file from the template:

```bash
cp .env.example .env
```

The application uses **Joi validation** to ensure all environment variables are properly configured with strict validation rules:

### Validation Features

- **Database Configuration**: Hostname and port validation for PostgreSQL connection
- **Cache Configuration**: Redis hostname and port validation with optional password
- **JWT Security**: All secrets must be minimum 32 characters, TTL values must be positive integers
- **Email Configuration**: SMTP hostname, port, and email format validation
- **Strict Type Checking**: All variables validated for correct data types and formats
- **Clear Error Messages**: Detailed validation errors with specific requirements
- **Startup Validation**: Application fails fast if any required variable is missing or invalid

See `.env.example` for all required variables and their expected formats. If validation fails, the application will throw detailed error messages indicating which variables need attention.

## Deployment

### Production Build

```bash
# Build for production
pnpm run build

# Start production server
pnpm run start:prod
```

### Docker Production

```bash
# Build production image
docker build -t boilerplater .

# Run with environment variables
docker run -p 3000:3000 --env-file .env boilerplater
```

## Contributing

1. Fork the repository
2. Create a feature branch following Git Flow: `git checkout -b feat/new-feature`
3. Make your changes following the coding standards:
   - **No comments** except docstrings when requested
   - Follow Clean Architecture layer boundaries
   - Use specialized Claude agents for quality assurance
4. Run quality checks: `pnpm run lint && pnpm run type-check && pnpm run test`
5. Commit using conventional format: `git commit -m "feat: add new feature"`
6. Push to the branch: `git push origin feat/new-feature`
7. Open a Pull Request targeting `dev` branch (for features) or `main` (for hotfixes)

### Pull Request Guidelines
- Use **PR Preparation Agent** before opening PR
- Ensure all Claude agents pass their respective checks
- Follow Git Flow branch targeting rules
- Include comprehensive test coverage using structured testing workflow

## License

This project is [MIT licensed](LICENSE).
