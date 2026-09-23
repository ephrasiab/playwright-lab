// @ts-check
// Lesson 1 - the four things that feel different coming from Cypress.
//
// 1. async/await instead of a command queue. In Cypress you chain (cy.get().click())
//    and Cypress runs the chain later. Here every call returns a Promise and you
//    await it, so ordinary JavaScript works: if, for, try/catch, helper functions.
// 2. Locators are lazy. page.getByRole(...) does not touch the page until you act
//    on it, so you can build them up front and reuse them.
// 3. Auto-waiting is built into the action, not the assertion. click() waits for the
//    element to exist, be visible, be stable and be enabled before clicking.
// 4. Web-first assertions retry. expect(locator).toHaveText() polls until it passes
//    or times out - no cy.wait(1000), no .should() chain to remember.

const { test, expect } = require('@playwright/test');

test.describe('TodoMVC basics', () => {
  test.beforeEach(async ({ page }) => {
    // './' resolves against baseURL. A leading '/' would jump to the domain root.
    await page.goto('./');
  });

  test('adds a todo item', async ({ page }) => {
    // getByRole is the preferred locator: it finds the element the way a screen
    // reader (and a user) does, so it survives CSS and markup changes. This is the
    // answer to the "app removed the data-testid from the icon" problem.
    const newTodo = page.getByPlaceholder('What needs to be done?');

    await newTodo.fill('Learn Playwright');
    await newTodo.press('Enter');

    // No wait, no retry logic: the assertion itself polls until the list updates.
    await expect(page.getByTestId('todo-title')).toHaveText('Learn Playwright');
    await expect(page.getByTestId('todo-item')).toHaveCount(1);
  });

  test('completes a todo and filters the list', async ({ page }) => {
    const newTodo = page.getByPlaceholder('What needs to be done?');

    // Plain JavaScript loop - in Cypress this needs .then() or .each() gymnastics.
    for (const title of ['Write tests', 'Run tests', 'Read the trace']) {
      await newTodo.fill(title);
      await newTodo.press('Enter');
    }
    await expect(page.getByTestId('todo-item')).toHaveCount(3);

    // Scope a locator to a parent, then act inside it. Cypress: .within().
    const second = page.getByTestId('todo-item').nth(1);
    await second.getByRole('checkbox').check();
    await expect(second).toHaveClass(/completed/);

    await page.getByRole('link', { name: 'Active' }).click();
    await expect(page.getByTestId('todo-item')).toHaveCount(2);

    await page.getByRole('link', { name: 'Completed' }).click();
    // Strict mode: a locator used with a single expected value must match exactly one
    // element, otherwise Playwright fails instead of silently picking the first.
    // Passing an ARRAY asserts the whole collection - count and order in one line.
    await expect(page.getByTestId('todo-title')).toHaveText(['Run tests']);
  });

  test('edits a todo by double-clicking it', async ({ page }) => {
    const newTodo = page.getByPlaceholder('What needs to be done?');
    await newTodo.fill('Frist draft');
    await newTodo.press('Enter');

    const item = page.getByTestId('todo-item').first();
    await item.dblclick();

    // The edit box only exists after the double click. No explicit wait needed:
    // fill() waits for the element to be ready.
    const editBox = item.getByRole('textbox', { name: 'Edit' });
    await editBox.fill('First draft');
    await editBox.press('Enter');

    await expect(page.getByTestId('todo-title')).toHaveText('First draft');
  });
});
