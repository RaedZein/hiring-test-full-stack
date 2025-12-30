# Developer Commands

## Quick Reference

### Development Scripts (Recommended)

| Task | Command | Platform |
|------|---------|----------|
| **Start both servers** | `./dev.sh` | Unix/Mac/WSL |
| **Start both servers** | `dev.bat` | Windows |

These scripts automatically:
- Install dependencies if missing
- Start backend (port 8000)
- Start frontend (port 3000)
- Handle cleanup on exit

### Individual Commands

| Task | Command | Directory |
|------|---------|-----------|
| Install dependencies | `npm install` | server/ or web/ |
| Start backend only | `npm start` | server/ |
| Start frontend only | `npm start` | web/ |
| Build backend | `npm run build:ts` | server/ |
| Build frontend | `npm run build` | web/ |
| Test backend | `npm test` | server/ |
| Test frontend | `npm test` | web/ |

## Quality Gate (Required Before Completion)

```bash
# TypeScript check
cd server && npm run build:ts

# Full build
cd web && npm run build
```

## Repo Map Generation

**When to run:**
- At start of new plan
- After adding/removing files
- At end of plan (if structural changes)

**Method** (try in order, fallback if unavailable):

1. **MCP RepoMapper tool** (try first):
   - Use `mcp_*_repo_map` tool
   - Automatically handles project root and output path
   - Falls back to Python script if unavailable

2. **Python script** (fallback):
   ```powershell
   python .repomapper/repomap.py . | Out-File -FilePath docs/ai/maps/REPO_MAP.md -Encoding utf8
   ```

3. **npm script** (if root package.json exists):
   ```bash
   npm run repomap
   ```

**Note:** Commands silently skip if RepoMapper (`.repomapper/`) is not present.

**Output:** `docs/ai/maps/REPO_MAP.md`

## Type Checking Only

No ESLint configured. TypeScript strict mode serves as the quality gate:
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`

