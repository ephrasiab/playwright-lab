# Learning plan

Goal: be able to walk into a Playwright codebase and be useful on day one, and leave a
public repo behind that shows the reasoning, not just passing tests.

Background this plan assumes: several years of Cypress (large Cucumber/BDD suite, page
objects, DB and API setup through `cy.task`, Azure DevOps pipelines), k6 performance
testing, SQL, and CI ownership. So the plan skips "what is a test" and spends its time
on what is genuinely different, and on the problems that cost real days in the past:
selector drift after a UI-library change, MFA/login cascades, flaky reruns that hide the
first failure, and slow suites.

Each lesson: roughly an hour, one spec file, notes in the README, one commit.

| # | Lesson | Covers | The problem it answers |
|---|---|---|---|
| 01 | Basics | `async/await`, lazy locators, auto-waiting, web-first assertions, strict mode | done |
| 02 | Locator strategy | `getByRole` and the a11y tree, `filter()`, chaining, `testIdAttribute` config, when CSS is still right | a component library drops its test ids and 40 tests break |
| 03 | Authenticate once | `storageState`, a `setup` project with `dependencies`, TOTP generation in a fixture, per-role sessions | a login/MFA hiccup cascading into every later test |
| 04 | Fixtures and page objects | custom fixtures vs POM, test-scoped vs worker-scoped, fixture composition, `test.step` | shared setup that used to live in hooks and global state |
| 05 | API in tests | `request` fixture, create data by API and verify in UI, `page.route` for mocking, API-only specs | slow UI setup, and tests that fail for reasons unrelated to what they check |
| 06 | Test data from Node | talking to SQL, generating files, per-worker data isolation, cleanup that actually runs | the `cy.task` bridge, and leftover data after a failed run |
| 07 | Debugging | Trace Viewer, UI mode, `codegen`, `--last-failed`, retries without losing the first attempt | a failed nightly run where the report showed the symptom, not the cause |
| 08 | CI | Azure DevOps YAML, sharding across agents, HTML report as an artifact, flake reporting, when to retry | a 45-minute suite and a pipeline nobody trusts |
| 09 | BDD (optional) | `playwright-bdd`, reusing existing Gherkin, whether it is worth it | interviews and teams that are committed to Cucumber |
| 10 | Extras (optional) | accessibility checks with axe, visual comparison, component testing | things that come up in interviews as "have you tried..." |

**Capstone.** A small suite against a public demo app that uses everything above: page
objects plus fixtures, API-based setup, one authenticated role, a trace on failure and a
CI config. That repo is the portfolio piece, not the lessons themselves.

## Rules for this repo

- Nothing from any client goes in here: no code, selectors, URLs, data or names. Every
  example uses a public demo app.
- Commits use the personal git identity configured locally in this repo.
- Each lesson keeps its mistakes in the notes. The failures are the interesting part.

## Practice targets

- `https://demo.playwright.dev/todomvc` - stable, no login, good for mechanics
- `https://www.saucedemo.com` - login, roles, a deliberately broken user
- `https://practicesoftwaretesting.com` - real-ish app with an API and a database behind it

## Environment notes (this machine)

- Node 20.x, Playwright 1.63, Chromium and Firefox installed.
- `ELECTRON_RUN_AS_NODE` and `NODE_OPTIONS` inherited from the editor break browser
  launches; unset them before running.
- A TLS-inspecting corporate proxy is in the path, so `ignoreHTTPSErrors: true` is set in
  the config. That belongs to this machine, not to a real project.
