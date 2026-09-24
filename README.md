# playwright-lab

Learning Playwright with a Cypress background. Each lesson is a spec file plus notes
on what is genuinely different, not a rewrite of the official tutorial.

```bash
npm install
npx playwright install chromium firefox
npx playwright test                 # all projects
npx playwright test --ui            # watch mode with a time-travel debugger
npx playwright show-report          # last HTML report
```

## Cypress to Playwright

| Cypress | Playwright | Note |
|---|---|---|
| `cy.visit('/x')` | `await page.goto('./x')` | `baseURL` is resolved with `new URL()`, so a leading `/` jumps to the domain root |
| `cy.get('.sel').click()` | `await page.locator('.sel').click()` | every call is awaited; no command queue |
| `cy.contains('Save')` | `page.getByRole('button', { name: 'Save' })` | role-based locators survive CSS and markup changes |
| `cy.get('[data-testid=x]')` | `page.getByTestId('x')` | test-id attribute name is configurable |
| `.within()` | `parent.getByRole(...)` | locators chain to scope |
| `.eq(1)` | `.nth(1)` | also `.first()`, `.last()` |
| `.should('have.text', 'x')` | `await expect(loc).toHaveText('x')` | assertions retry on their own |
| `.should('have.length', 3)` | `await expect(loc).toHaveCount(3)` | |
| `cy.wait(1000)` | (nothing) | actions wait for the element to be actionable |
| `cy.intercept()` | `page.route()` / `page.waitForResponse()` | |
| `cy.request()` | `request.get()` fixture or `page.request` | shares the browser cookie jar when you want it |
| `cy.task()` | import Node code directly | tests already run in Node, so there is no bridge to cross |
| `beforeEach` + login | `storageState` + fixtures | log in once per run, reuse the session |
| `cypress.config.js` | `playwright.config.js` | `projects` run the same specs across browsers |
| retries + screenshots | `trace: 'on-first-retry'` | the trace records every attempt, so the first failure is not lost |

## Lessons

### 01 - basics
`tests/01-basics.spec.js`

Four differences that matter on day one: `async/await` instead of a command queue,
lazy locators, auto-waiting built into actions, and assertions that retry themselves.
Plain JavaScript control flow works, so a `for` loop over test data needs no `.then()`.

Two failures while writing it, both diagnosed from the error output alone:

1. **Wrong `baseURL`** - `https://.../todomvc` without a trailing slash plus `goto('/')`
   lands on the domain root. The failure report includes a text snapshot of the page,
   which said `404 - File not found` instead of leaving a screenshot to interpret.
2. **Strict mode violation** - `toHaveText('Run tests')` on a locator that matched two
   elements fails instead of silently taking the first one. Passing an array,
   `toHaveText(['Run tests'])`, asserts the whole collection: contents, count and order.

Both are a fair summary of the change in mindset: the tool refuses ambiguity and tells
you what the page actually looked like.

## Plan

See [LEARNING_PLAN.md](LEARNING_PLAN.md) for the full lesson list, the rules this repo
follows, and the practice apps used.
