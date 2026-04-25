# NestJS Library Generator

Create NestJS libraries with pre-defined types for better organization and consistency.

## Usage

To use this generator, run:

```bash
# Using full path
nx g @steam-idler/generators:nest-library

# Or with Nx Console UI (recommended)
# Open Command Palette > Nx: Generate > Select tools/generators/nest-library
```

## Library Types

- `core` - Shared system-wide infrastructure such as config, logging, and database setup.
- `domain` - Pure business logic and data-access layer: entities, rules, domain services, repositories and interfaces.
- `data-access` - External API implementations.
- `feature` - NestJS modules, controllers, and application services that expose domain logic.
- `util` - Small generic helpers and reusable functions not tied to any domain.

example

```bash
# Core library
nx g @steam-idler/generators:nest-library database --type=core --directory=server
```

## Options

- `name` (required) - Library name
- `type` (required) - Library type (core, domain, data-access, feature, util)
- `directory` (optional) - Directory where the library is placed
- `tags` (optional) - Additional tags (comma-separated)
- `buildable` (optional) - Generate a buildable library
- `publishable` (optional) - Generate a publishable library
- `importPath` (optional) - Custom import path

## 1. Core Libraries

**Purpose:**  
Provide foundational, application-wide building blocks that are shared across all features and services.

**Typical Contents:**

- Global configuration management
- Logging utilities
- Database connection setup and modules
- Common NestJS providers used system-wide

**Characteristics:**

- Reusable across the entire monorepo
- Contains infrastructure-level concerns, not business logic
- Does not depend on feature or domain libraries

## 2. Domain Libraries

**Purpose:**  
Define the business logic, rules, and core models of the application.

**Typical Contents:**

- Entities, value objects, and aggregates
- Domain services containing pure business logic
- Repositories
- Business rules and invariants

**Characteristics:**

- Contains no NestJS or database implementation details
- Can be tested independently of frameworks
- Serves as the central source of truth for business behavior

## 3. Data-Access Libraries

**Purpose:**  
Provide concrete implementations of persistence, external API communication, and storage mechanisms for a specific domain area.

**Typical Contents:**

- ORM or database repository implementations (adapters)
- Mappers between domain models and persistence models
- External service API clients (e.g., Stripe, S3, payment gateways)
- Integrations with databases, caching layers, queues, etc.

**Characteristics:**

- Implements the repository interfaces defined in the domain library
- Depends on infrastructure (database drivers, external SDKs)
- Does not contain business rules or HTTP controllers

## 4. Feature Libraries

**Purpose:**  
Expose domain capabilities through NestJS modules and orchestrate application logic, connecting domain and data-access layers.

**Typical Contents:**

- NestJS modules
- Controllers or GraphQL resolvers
- Application services / use-case handlers
- DTOs for incoming and outgoing data
- Feature-specific NestJS guards, interceptors, and pipes

**Characteristics:**

- Handles requests and coordinates domain operations
- Depends on domain and data-access libraries
- Encapsulates the public API for a functional area of the system

## 5. Utility Libraries

**Purpose:**  
Provide small, generic, reusable functionality that is not tied to any specific feature or domain.

**Typical Contents:**

- General helper functions
- Reusable algorithms
- TypeScript utilities
- Testing utilities

**Characteristics:**

- Independent of business logic
- Should remain small and narrowly focused
- Reusable across the monorepo without introducing higher-level dependencies
