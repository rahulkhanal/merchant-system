# ADR-005: Hand-Written TypeORM Migrations, Build-First Generate

**Date:** 2026-11-22  
**Status:** Accepted

## Context

The project uses NestJS with rspack (SWC-based bundler) for compilation. TypeORM's `migration:generate` command uses `tsx` (esbuild) to load the data source, which strips `emitDecoratorMetadata` — causing TypeORM decorator reflection to fail with `Cannot read properties of undefined (reading 'constructor')`.

Options considered:
1. **Hand-write all migrations** — always safe, no tooling dependency
2. **`@swc-node/register`** — SWC supports `emitDecoratorMetadata`, no build step needed
3. **Build-first, run against compiled output** — rspack/SWC preserves metadata in the build

## Decision

**Migration scripts build first, then run TypeORM CLI against compiled output:**

```json
"migration:generate": "nest build api && node node_modules/typeorm/cli.js migration:generate -d dist/apps/api/data-source.js"
```

Usage: `pnpm migration:generate -- apps/api/src/migrations/MigrationName`

**Initial and schema-change migrations are hand-written** using `IF NOT EXISTS` guards and `DO $$ ... EXCEPTION WHEN duplicate_object` for enum types, making them safe to run against an existing database.

**`synchronize: false`** in all TypeORM configs — the database is never auto-synced from entities.

## Consequences

**Positive**
- `migration:generate` works correctly — rspack/SWC preserves decorator metadata
- No additional dev dependencies (`@swc-node/register`, `ts-node`)
- Generated migrations are `.ts` files in `src/migrations/` (not compiled output)
- `IF NOT EXISTS` guards make hand-written migrations idempotent

**Negative**
- `migration:generate` requires a full build (~10–15s) before diffing
- Build output must be up to date with source when generating
