# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gps-consent.spec.js >> GPS Consent Tests >> GPS bloqueado al denegar consentimiento
- Location: tests\e2e\gps-consent.spec.js:62:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/dashboard" until "load"
  navigated to "http://localhost:5173/employee-clock"
============================================================
```

# Test source

```ts
  1  | import { expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Page Object for Login Page
  5  |  * Handles authentication flows for E2E testing
  6  |  */
  7  | export class LoginPage {
  8  |   constructor(page) {
  9  |     this.page = page;
  10 |     this.emailInput = page.locator('input[type="email"]');
  11 |     this.passwordInput = page.locator('input[type="password"]');
  12 |     this.loginButton = page.locator('button[type="submit"]');
  13 |     this.errorMessage = page.locator('.error-message');
  14 |   }
  15 | 
  16 |   async goto() {
  17 |     await this.page.goto('/login');
  18 |   }
  19 | 
  20 |   async login(email, password) {
  21 |     await this.emailInput.fill(email);
  22 |     await this.passwordInput.fill(password);
  23 |     await this.loginButton.click();
  24 |   }
  25 | 
  26 |   async loginAsAdmin() {
  27 |     await this.login('admin@tempos.com', 'admin123');
  28 |     await this.page.waitForURL('**/dashboard');
  29 |   }
  30 | 
  31 |   async loginAsEmployee() {
  32 |     await this.login('employee@tempos.com', 'employee123');
> 33 |     await this.page.waitForURL('**/dashboard');
     |                     ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  34 |   }
  35 | 
  36 |   async expectErrorMessage(message) {
  37 |     await expect(this.errorMessage).toContainText(message);
  38 |   }
  39 | }
```