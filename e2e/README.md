# E2E Tests

Playwright end-to-end tests running against the stage backend infrastructure.

## Setup

1. Copy the env template and fill in your Keycloak credentials:

```bash
cp e2e/.env.e2e.example e2e/.env.e2e
```

2. Edit `e2e/.env.e2e` with your username and password.

3. Install Playwright browsers (first time only):

```bash
npx playwright install chromium
```

**NixOS users**: Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` in `.env.e2e` to your system Chromium path (e.g. `/run/current-system/sw/bin/chromium`).

## Running Tests

```bash
npm run test:e2e          # Headless run
npm run test:e2e:ui       # Playwright UI mode (interactive)
npm run test:e2e:headed   # Headed browser (watch it run)
npm run test:e2e:debug    # Debug mode with Playwright inspector
```

Run a specific test file:

```bash
npx playwright test --config e2e/playwright.config.ts e2e/tests/auth/login.spec.ts
```

Run tests matching a tag:

```bash
npx playwright test --config e2e/playwright.config.ts --grep @critical
```

## Writing New Tests

### Manual approach

1. Create a page object: `e2e/pages/{feature}.page.ts`
2. Create a test file: `e2e/tests/{feature}/{feature}.spec.ts`
3. Register the page object in `e2e/fixtures/index.ts`
4. Add an entry to `e2e/coverage-map.ts`

### Scaffold script

```bash
npx tsx e2e/scripts/scaffold-test.ts --view=MyNewView
```

This generates the page object, test file, and coverage map entry automatically.

### Page object pattern

```typescript
import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class MyFeaturePage {
  constructor(private page: Page) {}

  get someElement() {
    return this.page.getByRole('button', { name: 'Click me' })
  }

  async goto() {
    await this.page.goto('my-feature')
  }

  async expectVisible() {
    await expect(this.someElement).toBeVisible()
  }
}
```

### Locator strategy

Use accessible locators only — no `data-testid`:

- `getByRole('button', { name: '...' })`
- `getByLabel('...')`
- `getByText('...')`
- `getByPlaceholder('...')`

If a component is hard to select accessibly, improve its ARIA attributes.

## Conventions

- **Test tags**: Add a tag in `test.describe` names to categorise tests:

  | Tag | Meaning | Runs by default |
  |---|---|---|
  | `@critical` | Core functionality that must always work | Yes |
  | `@important` | Key workflows users rely on regularly | Yes |
  | `@secondary` | Non-critical features or edge cases | Yes |
  | `@experimental` | Work-in-progress, known-unstable tests | **No** — skipped via `grepInvert` in config |

  Run experimental tests explicitly: `npx playwright test --config e2e/playwright.config.ts --grep @experimental`

- **Test data**: Use `testTitle()` / `testSlugline()` from `helpers/test-data.ts` — prefixes content with `[E2E-TEST]` for identification and cleanup
- **Env-gated tests**: Tests requiring specific document IDs use `test.skip(!id, '...')` with env vars like `E2E_TEST_ARTICLE_ID`

## Coverage Map

The coverage map (`e2e/coverage-map.ts`) tracks which features have E2E tests (32 features). Every `.spec.ts` file must be mapped. Check for gaps:

```bash
npm run test:e2e:check-gaps
```

This reports unmapped test files and uncovered features. It exits with code 1 if any features are marked `uncovered`. When adding a new test, always add a corresponding entry to `coverage-map.ts`.

## Project Structure

```
e2e/
  playwright.config.ts      # Playwright configuration
  global-setup.ts           # Auth setup (Keycloak login, saves session)
  global-teardown.ts        # Restores test article to known version after suite
  .env.e2e                  # Credentials (gitignored)
  .env.e2e.example          # Template (committed)
  coverage-map.ts           # Feature-to-test mapping
  tsconfig.json             # TypeScript config
  fixtures/
    index.ts                # Custom test fixtures (authenticated pages)
    auth.fixture.ts         # Unauthenticated test + reauthenticate helper
  pages/                    # Page Object Models
  helpers/
    api.ts                  # Direct API helpers for setup/teardown
    document.ts             # Document capture and verification helpers
    test-data.ts            # Test data factories ([E2E-TEST] prefix)
    cleanup.ts              # Tracks created documents for manual cleanup (no auto-delete)
    wait.ts                 # Custom wait helpers (waitForAppReady, waitForNetworkIdle)
  reporters/
    coverage-reporter.ts    # Custom Playwright reporter for coverage
  scripts/
    scaffold-test.ts        # Generate test + page object skeletons
    check-coverage-gaps.ts  # Check coverage map for uncovered features
  tests/                    # Test specs organized by feature
```
