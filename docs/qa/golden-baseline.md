# Golden Baseline

This repo now includes a reproducible golden regression dataset captured from the validated local state on `2026-03-23T03:51:57Z`.

## Location

Golden snapshot directory:

- [`backups/golden/2026-03-23-regression-pass`](../../backups/golden/2026-03-23-regression-pass)

Included artifacts:

- [`modular-portal.bundle`](../../backups/golden/2026-03-23-regression-pass/modular-portal.bundle)
- [`database-snapshot.json`](../../backups/golden/2026-03-23-regression-pass/database-snapshot.json)
- [`storage`](../../backups/golden/2026-03-23-regression-pass/storage)
- [`.env.golden.local`](../../backups/golden/2026-03-23-regression-pass/.env.golden.local)
- [`manifest.json`](../../backups/golden/2026-03-23-regression-pass/manifest.json)

## Provenance

- Git commit: `12eeabe2e58ab6722b85e6b1bfd99b94d954f78d`
- Git worktree state at capture: clean
- Validated local database: `payer_portal_eb_demo`

## Notes

- The code baseline was exported as a Git bundle so the exact source snapshot can be recreated without relying on the current local branch state.
- The database was exported as a Prisma JSON snapshot because `pg_dump` was not installed on the host at capture time.
- The validated local release credentials are captured in [`.env.golden.local`](../../backups/golden/2026-03-23-regression-pass/.env.golden.local) for deterministic local reruns.

## Restore

1. Restore code from the Git bundle if needed:

```bash
git clone backups/golden/2026-03-23-regression-pass/modular-portal.bundle modular-portal-golden
```

2. Apply the golden env values:

```bash
cp backups/golden/2026-03-23-regression-pass/.env.golden.local .env
```

3. Start local services so Postgres is available:

```bash
pnpm services:start
```

4. Restore the golden database snapshot:

```bash
node ./scripts/testing/restore-golden-dataset.mjs
```

5. Restore storage-backed artifacts:

```bash
rm -rf apps/api/storage
cp -R backups/golden/2026-03-23-regression-pass/storage apps/api/storage
```

6. Run the validated regression pack:

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm --filter portal-web test
pnpm --filter admin-console test
node ./scripts/testing/run-smoke-tests.mjs
set -a; source ./.env; set +a; node ./scripts/testing/run-integration-tests.mjs
set -a; source ./.env; set +a; node ./scripts/testing/validate-release.mjs
```
