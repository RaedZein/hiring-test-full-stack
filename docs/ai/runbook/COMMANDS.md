# Developer Commands

## Quick Reference

| Task | Command | Directory |
|------|---------|-----------|
| Start backend | `npm start` | server/ |
| Start frontend | `npm start` | web/ |
| Build backend | `npm run build:ts` | server/ |
| Build frontend | `npm run build` | web/ |
| Generate repo map | `npm run repomap` | root |

## Quality Gate (Required Before Completion)

```bash
# Both must pass with no errors
cd server && npm run build:ts
cd web && npm run build
```

## Repo Map Generation

**When to run:**
- At start of new plan
- After adding/removing files
- At end of plan (if structural changes)

```bash
npm run repomap
```

**Note:** Command silently skips if RepoMapper (`.repomapper/`) is not present.

**Output:** `docs/ai/maps/REPO_MAP.md`

## Type Checking Only

No ESLint configured. TypeScript strict mode serves as the quality gate:
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`

