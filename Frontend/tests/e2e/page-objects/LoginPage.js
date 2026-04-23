import { expect } from '@playwright/test';

/**
 * Page Object for Login Page
 * Handles authentication flows for E2E testing
 */
export class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.error-message');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginAsAdmin() {
    await this.login('admin@tempos.com', 'admin123');
    await this.page.waitForURL('**/dashboard');
  }

  async loginAsEmployee() {
    await this.login('employee@tempos.com', 'employee123');
    await this.page.waitForURL('**/dashboard');
  }

  async expectErrorMessage(message) {
    await expect(this.errorMessage).toContainText(message);
  }
}