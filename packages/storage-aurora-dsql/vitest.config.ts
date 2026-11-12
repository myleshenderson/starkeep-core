import { configDefaults, defineConfig } from "vitest/config";

/**
 * A longer per-test timeout than the 5s default. The integration files run
 * against PGlite, a WebAssembly Postgres whose cold boot takes most of a second
 * on its own. Each file now boots once (in `beforeAll`, or the conformance
 * files' two-database pool on its first case) and resets between tests by
 * dropping schemas, but that first boot still lands inside a hook or the first
 * case, and under the full monorepo run — twenty packages' suites in parallel —
 * per-case boots repeatedly crossed 5s and failed while passing in isolation.
 *
 * A test that fails only when other tests are running is reporting machine load
 * rather than a defect, and the cost of that is worse than the cost of a slow
 * test: it trains a reader to rerun rather than to look.
 *
 * The hook timeout rises with it because `two-users.test.ts` and
 * `node-watermarks.test.ts` boot their PGlite in `beforeAll`, where the 10s hook
 * default applies instead, and the full run crossed that when the boot was
 * still in `beforeEach`.
 *
 * Unit tests run in `test` (tier 1, required in CI). Tests that boot a process,
 * a socket or a database engine live in `__tests__/integration/` and run in
 * `test:integration`.
 */
export default defineConfig({
  test: {
    testTimeout: 30_000,
    hookTimeout: 30_000,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["__tests__/**/*.test.ts"],
          exclude: [...configDefaults.exclude, "__tests__/integration/**"],
        },
      },
      {
        extends: true,
        test: { name: "integration", include: ["__tests__/integration/**/*.test.ts"] },
      },
    ],
  },
});
