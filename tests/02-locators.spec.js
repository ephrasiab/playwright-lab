// @ts-check
// Lesson 2 - locator strategy.
//
// The problem this answers: a component library upgrade removes the test ids from a
// set of icons and forty tests fail overnight, even though nothing a user sees changed.
// The tests were coupled to markup, not to behaviour.
//
// Playwright's recommended order, most resilient first:
//   1. getByRole        - what the element IS, as the accessibility tree reports it
//   2. getByLabel       - form fields by their label
//   3. getByPlaceholder / getByText / getByAltText / getByTitle
//   4. getByTestId      - an explicit contract with developers; stable only while it is kept
//   5. locator('css')   - last resort, or for things that have no role (layout wrappers)
//
// Tip: `await page.locator('body').ariaSnapshot()` prints the tree getByRole searches.
// Reading it first saves guessing names.

const { test, expect } = require('@playwright/test');

// Sauce Demo is a different app from lesson 1, so override baseURL for this file only.
// Its test ids live in `data-test`, not the default `data-testid`.
test.use({ baseURL: 'https://www.saucedemo.com/' });

/** @param {import('@playwright/test').Page} page */
async function login(page, user = 'standard_user') {
  await page.goto('./');
  // Scope to the form by its accessible name, then find fields by role inside it.
  const form = page.getByRole('form', { name: 'Login' });
  await form.getByRole('textbox', { name: 'Username' }).fill(user);
  await form.getByRole('textbox', { name: 'Password' }).fill('secret_sauce');
  await form.getByRole('button', { name: 'Login' }).click();
}

test.describe('test id attribute', () => {
  test('getByTestId finds nothing until the attribute name is configured', async ({ page }) => {
    await page.goto('./');
    // Default testIdAttribute is data-testid. The app uses data-test, so this matches 0.
    // No error is thrown - a locator is only a query - which is why a count check is
    // the honest way to show it.
    await expect(page.getByTestId('username')).toHaveCount(0);
  });

  test.describe('configured', () => {
    // One line fixes it. In a real project this goes in playwright.config.js `use`.
    test.use({ testIdAttribute: 'data-test' });

    test('getByTestId matches data-test', async ({ page }) => {
      await page.goto('./');
      await expect(page.getByTestId('username')).toBeVisible();
    });
  });
});

test.describe('inventory', () => {
  test.use({ testIdAttribute: 'data-test' });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('identical buttons: scope with filter() instead of nth()', async ({ page }) => {
    // Six products, six buttons all named "Add to cart".
    const addButtons = page.getByRole('button', { name: 'Add to cart' });
    await expect(addButtons).toHaveCount(6);

    // nth(4) would work today and break the day the sort order changes. Instead, find
    // the product card by what it contains, then the button inside that card.
    const onesie = page.getByTestId('inventory-item').filter({ hasText: 'Sauce Labs Onesie' });
    await onesie.getByRole('button', { name: 'Add to cart' }).click();

    // The same button re-renders as "Remove" - asserting on the role and name checks
    // the behaviour, not a CSS class.
    await expect(onesie.getByRole('button', { name: 'Remove' })).toBeVisible();
    await expect(addButtons).toHaveCount(5);
    await expect(page.getByTestId('shopping-cart-badge')).toHaveText('1');
  });

  test('filter({ has }) and filter({ hasNot }) combine locators', async ({ page }) => {
    const cards = page.getByTestId('inventory-item');

    await cards.filter({ hasText: 'Backpack' }).getByRole('button', { name: 'Add to cart' }).click();
    await cards.filter({ hasText: 'Bike Light' }).getByRole('button', { name: 'Add to cart' }).click();

    // "cards that contain a Remove button" = what is in the cart, read from the page.
    const inCart = cards.filter({ has: page.getByRole('button', { name: 'Remove' }) });
    await expect(inCart.getByTestId('inventory-item-name')).toHaveText([
      'Sauce Labs Backpack',
      'Sauce Labs Bike Light',
    ]);

    const notInCart = cards.filter({ hasNot: page.getByRole('button', { name: 'Remove' }) });
    await expect(notInCart).toHaveCount(4);
  });

  test('sort by price: read a whole column and compare in plain JS', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Sort products' }).selectOption('Price (low to high)');

    const priceCells = page.getByTestId('inventory-item-price');
    // allTextContents() does NOT wait or retry - it reads whatever is there right now.
    // Assert something that does retry first, so the page has settled.
    await expect(priceCells.first()).toHaveText('$7.99');

    const prices = (await priceCells.allTextContents()).map((p) => Number(p.replace('$', '')));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('simulated drift: strip every test id, role locators still pass', async ({ page }) => {
    // What a component library upgrade did in a past project: the ids disappeared.
    await page.evaluate(() => {
      document.querySelectorAll('[data-test]').forEach((el) => el.removeAttribute('data-test'));
    });
    await expect(page.getByTestId('inventory-item')).toHaveCount(0);

    // The user-facing contract did not change, so these still work.
    await page.getByRole('button', { name: 'Add to cart' }).first().click();
    await expect(page.getByRole('button', { name: 'Remove' })).toHaveCount(1);
    await page.getByRole('button', { name: 'Open Menu' }).click();
    // First attempt used getByRole('link'). The markup IS an <a>, but it has no href,
    // so the accessibility tree reports it as a button. Role comes from the tree, not
    // from the tag name - read the aria snapshot, don't guess from the HTML.
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('aria snapshot: assert the structure of a region in one go', async ({ page }) => {
    // toMatchAriaSnapshot compares against the accessibility tree, a partial match.
    // Good for "the header shows these controls"; brittle if overused for whole pages.
    await expect(page.getByRole('combobox', { name: 'Sort products' })).toMatchAriaSnapshot(`
      - combobox "Sort products":
        - option "Name (A to Z)" [selected]
        - option "Name (Z to A)"
        - option "Price (low to high)"
        - option "Price (high to low)"
    `);
  });
});

test.describe('login errors', () => {
  test('locked out user: assert the message the user sees', async ({ page }) => {
    await login(page, 'locked_out_user');
    // Error banners are often role="alert", but not in this app, so fall back to text
    // with a regex. A regex matches a substring; /i makes the case explicit.
    await expect(page.getByText(/locked out/i)).toBeVisible();
    // The fields go into an error state. In lesson terms: assert what the user sees
    // (the message), and use attributes only for what has no visible form.
    await expect(page.getByRole('textbox', { name: 'Username' })).toHaveClass(/error/);
  });
});
