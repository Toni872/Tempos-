import { test, expect } from '@playwright/test';
import { LoginPage } from './page-objects/LoginPage.js';
import { DashboardPage } from './page-objects/DashboardPage.js';

test.describe('GPS Consent Tests', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    // Clear localStorage to reset consent state
    await page.context().addInitScript(() => {
      localStorage.clear();
    });
  });

  test('Modal de consentimiento se muestra al primer acceso', async ({ page }) => {
    // Login as employee
    await loginPage.goto();
    await loginPage.loginAsEmployee();

    // Verify geolocation consent modal appears
    await dashboardPage.expectGeolocationModalVisible();

    // Verify modal content
    await expect(page.locator('.geolocation-consent-modal h2')).toContainText('Geolocation Permission');
    await expect(page.locator('.geolocation-consent-modal')).toContainText('privacy policy');
    await expect(page.locator('.geolocation-consent-modal')).toContainText('terms of service');
  });

  test('GPS habilitado al aceptar consentimiento', async ({ page }) => {
    // Grant geolocation permission at browser level
    await page.context().grantPermissions(['geolocation']);

    // Set valid GPS coordinates
    await page.context().setGeolocation({
      latitude: 40.4170,
      longitude: -3.7040,
      accuracy: 8
    });

    // Login as employee
    await loginPage.goto();
    await loginPage.loginAsEmployee();

    // Accept geolocation consent
    await dashboardPage.handleGeolocationConsent(true);

    // Wait for dashboard to load
    await dashboardPage.waitForLoad();

    // Verify GPS is enabled
    await expect(page.locator('.gps-status')).toContainText('GPS enabled');

    // Perform clock-in successfully
    await dashboardPage.clockIn();
    await dashboardPage.expectClockInSuccessful();
  });

  test('GPS bloqueado al denegar consentimiento', async ({ page }) => {
    // Login as employee
    await loginPage.goto();
    await loginPage.loginAsEmployee();

    // Deny geolocation consent
    await dashboardPage.handleGeolocationConsent(false);

    // Wait for dashboard to load
    await dashboardPage.waitForLoad();

    // Verify GPS is blocked
    await dashboardPage.expectGpsBlocked();

    // Attempt clock-in (should fail)
    await dashboardPage.clockIn();

    // Verify error message
    await expect(page.locator('.error-message')).toContainText('Geolocation access denied');
  });

  test('Consentimiento recordado en localStorage', async ({ page }) => {
    // Login and accept consent
    await loginPage.goto();
    await loginPage.loginAsEmployee();
    await dashboardPage.handleGeolocationConsent(true);
    await dashboardPage.waitForLoad();

    // Verify consent is stored
    const consentValue = await page.evaluate(() => localStorage.getItem('geolocation-consent'));
    expect(consentValue).toBe('accepted');

    // Reload page
    await page.reload();

    // Verify modal doesn't appear again
    await dashboardPage.waitForLoad();
    await expect(page.locator('.geolocation-consent-modal')).not.toBeVisible();
  });

  test('Revocación de consentimiento deshabilita GPS', async ({ page }) => {
    // First, accept consent
    await loginPage.goto();
    await loginPage.loginAsEmployee();
    await dashboardPage.handleGeolocationConsent(true);
    await dashboardPage.waitForLoad();

    // Verify GPS enabled
    await expect(page.locator('.gps-status')).toContainText('GPS enabled');

    // Simulate revoking consent (this would be done via settings)
    await page.evaluate(() => {
      localStorage.setItem('geolocation-consent', 'denied');
    });

    // Reload page
    await page.reload();

    // Verify GPS is now blocked
    await dashboardPage.waitForLoad();
    await dashboardPage.expectGpsBlocked();
  });

  test('Enlaces a documentos legales funcionan', async ({ page }) => {
    // Login as employee
    await loginPage.goto();
    await loginPage.loginAsEmployee();

    // Verify modal appears
    await dashboardPage.expectGeolocationModalVisible();

    // Check privacy policy link
    const privacyLink = page.locator('.geolocation-consent-modal a:has-text("privacy policy")');
    await expect(privacyLink).toHaveAttribute('href', '/privacy-policy');

    // Check terms of service link
    const termsLink = page.locator('.geolocation-consent-modal a:has-text("terms of service")');
    await expect(termsLink).toHaveAttribute('href', '/terms-of-service');
  });
});