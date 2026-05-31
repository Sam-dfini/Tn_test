# TunisiaIntel v2 — Code Quality Audit & Remediation Plan

## Phase 1: TypeScript Strict Mode
**Target**: `tsconfig.json` + all frontend files
**Goal**: Enable `"strict": true` and eliminate all ~796 implicit-any errors
**Files**: tsconfig.json, src/store/*.ts, src/services/backendClient.ts, src/App.tsx, src/pages/*.tsx, src/workspace/blocks/*.tsx

## Phase 2: Bare Except Handling
**Target**: All backend Python files
**Goal**: Eliminate all `except Exception: pass` blocks with proper error handling, logging, and re-raises where appropriate
**Files**: backend/app/services/*.py, backend/app/orchestrator.py, backend/app/pipelines/*.py, backend/app/signals/*.py

## Phase 3: FastAPI Response Models
**Target**: All FastAPI route files
**Goal**: Add `response_model=` to every endpoint for type-safe API contracts
**Files**: All files under `backend/app/` with `@router` decorators

## Phase 4: React Prop & Component Hygiene
**Target**: Frontend component files
**Goal**: Type all props with interfaces, remove any, fix missing key props
**Files**: src/components/*.tsx, src/workspace/blocks/*.tsx, src/pages/*.tsx

## Phase 5: Test Infrastructure
**Target**: Both frontend and backend
**Goal**: Set up Vitest (frontend) and pytest (backend) with at least smoke tests
**Files**: vitest.config.ts, pytest.ini, src/**/*.test.tsx, backend/tests/*.py

## Phase 6: Environment Configuration
**Target**: Project root
**Goal**: Create `.env.example` with all required env vars documented
**Files**: .env.example

## Phase 7: Async Audit
**Target**: Backend async patterns
**Goal**: Verify all DB sessions, HTTP clients, and file handles are properly awaited/closed
**Files**: backend/app/**/*.py

## Phase 8: Agent Unification
**Target**: Any scattered agent/worker code
**Goal**: Centralize agent logic with consistent patterns
**Files**: backend/app/agents/*.py (or similar)

## Phase 9: Init Hygiene
**Target**: Python `__init__.py` files
**Goal**: Ensure clean import chains, no circular dependencies
**Files**: backend/app/**/__init__.py

## Phase 10: Alembic Migrations
**Target**: Database migration setup
**Goal**: Initialize Alembic, create initial migration
**Files**: alembic.ini, alembic/

## Phase 11: Dev Tooling
**Target**: Project-wide
**Goal**: Add linting (ESLint, Ruff), formatting (Prettier), pre-commit hooks
**Files**: .eslintrc.cjs, .prettierrc, .pre-commit-config.yaml, pyproject.toml
