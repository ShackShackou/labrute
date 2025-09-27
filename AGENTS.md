# Repository Guidelines

## Project Structure & Modules
- `client/` React (TypeScript, CRA). Static assets in `client/public`, app code in `client/src`, production build in `client/build`.
- `server/` Express + Prisma (TypeScript). Compiled output in `server/lib`; routes in `server/src/routes.ts`.
- `core/` Shared game logic and types (TypeScript). Output in `core/lib`.
- `prisma/` Prisma client and `schema.prisma`.
- `scripts/` Utility scripts (e.g., `scripts/postInstall.sh`).

## Build, Test, and Development
- `yarn dev` Run Prisma Studio, API (watch), React dev server, and Eternaltwin.
- `yarn build` Type-check/compile (tsc -b) then build client.
- `yarn start` Start the compiled server (serves API + SPA).
- Workspace examples: `yarn workspace @labrute/client start`, `yarn workspace @labrute/server start:watch`.
- Database: `yarn db:sync:dev`, `yarn db:seed`, `yarn db:reset`, `yarn studio` (Prisma Studio).

## Coding Style & Naming
- EditorConfig: 2 spaces, LF, max line length 120.
- ESLint (Airbnb + TypeScript). Default exports are disallowed; use named exports.
- Semicolons required. Prefix intentionally unused vars/params with `_`.
- React components: PascalCase; hooks: `useThing`; TypeScript: `.ts`/`.tsx`.

## Testing Guidelines
- Client (Jest via CRA): `yarn workspace @labrute/client test`.
- Name tests `*.test.tsx` (components) and `*.spec.ts` (utils). Co-locate near source.
- Server tests are minimal today; include tests for new logic when feasible.

## Commit & Pull Request Guidelines
- Commits: short, imperative subject; explain the “why” in the body if needed.
  Example: `Fix tooltip position with page scroll`.
- PRs: clear description, linked issues, test plan, screenshots/GIFs for UI changes, and note DB migrations/seed impacts.
- Before opening: `yarn clean && yarn install && yarn build` should pass; run `yarn audit` for security.

## Security & Config Tips
- Environment is read from `.env` (see `server/src/config.ts`). Do not commit secrets.
- Local DB config lives in `prisma/schema.prisma`. Post-install in dev syncs/seed DB.
- Node 16+ and Yarn 4 are required. Use workspace commands; avoid mixing npm/yarn.

