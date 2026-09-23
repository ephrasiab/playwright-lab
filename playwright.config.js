// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright config, annotated from a Cypress engineer's point of view.
 * Cypress equivalent: cypress.config.js
 */
module.exports = defineConfig({
  // Where the specs live. Cypress: specPattern.
  testDir: './tests',

  // Every test in a FILE runs in parallel by default (Cypress runs files serially).
  fullyParallel: true,

  // Cypress: retries: { runMode: 1, openMode: 0 }
  // Same idea, but a retried test keeps its trace, so the FIRST attempt is not lost.
  retries: process.env.CI ? 1 : 0,

  // Parallel worker processes. Locally = half your cores; on CI, keep it to 1-2.
  workers: process.env.CI ? 2 : undefined,

  // Cypress: mocha-multi-reporters (mochawesome + junit).
  // 'html' opens an interactive report that embeds traces, video and screenshots.
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    // Cypress: baseUrl. Used by page.goto('/path').
    // NOTE: keep the trailing slash. baseURL + path is resolved with new URL(), so
    // 'https://demo.playwright.dev/todomvc' + '/' would land on the domain root (404).
    baseURL: 'https://demo.playwright.dev/todomvc/',

    // Cypress: defaultCommandTimeout: 10000. Playwright waits per-action instead.
    actionTimeout: 10_000,
    navigationTimeout: 30_000,

    // THE feature that replaces screenshot forensics: a full recording of the run
    // (DOM snapshots, network, console) you can step through afterwards.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // This machine sits behind a ZScaler TLS-inspecting proxy, and Playwright's
    // bundled browsers do not carry the corporate root CA. Without this, public
    // sites can fail with ERR_CERT_AUTHORITY_INVALID. Never do this against a
    // real product environment - there you install the CA instead.
    ignoreHTTPSErrors: true,
  },

  // Cypress: you pick a browser at run time. Here each "project" is a browser
  // (or a device, or a setup step) and they all run in one command.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
