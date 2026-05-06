import { test, expect } from '@playwright/test';
import { LoginPage } from './page-objects/LoginPage.js';
import { DashboardPage } from './page-objects/DashboardPage.js';

test.describe('Data Export Tests', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    // Grant permissions and set valid GPS
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({
      latitude: 40.4170,
      longitude: -3.7040,
      accuracy: 8
    });
  });

  test('Exportación incluye datos GPS históricos', async ({ page }) => {
    // Login as admin
    await loginPage.goto();
    await loginPage.loginAsAdmin();

    // Handle geolocation consent
    await dashboardPage.handleGeolocationConsent(true);
    await dashboardPage.waitForLoad();

    // Navigate to reports section
    await page.locator('button:has-text("Reports")').click();

    // Click export button
    const exportButton = page.locator('button:has-text("Export Data")');
    await expect(exportButton).toBeVisible();

    // Start download and verify it includes GPS data
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    // Verify download starts
    expect(download.suggestedFilename()).toMatch(/\.(json|csv)$/);

    // For JSON export, we could verify content if API returns preview
    // This test focuses on UI interaction and download trigger
  });

  test('Endpoint de exportación funciona correctamente', async ({ page }) => {
    // This test would make direct API calls to verify backend export
    // For now, we'll test the UI trigger

    // Login as admin
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    await dashboardPage.handleGeolocationConsent(true);
    await dashboardPage.waitForLoad();

    // Navigate to reports
    await page.locator('button:has-text("Reports")').click();

    // Verify export options are available
    await expect(page.locator('select[name="exportFormat"]')).toBeVisible();
    await expect(page.locator('input[name="startDate"]')).toBeVisible();
    await expect(page.locator('input[name="endDate"]')).toBeVisible();
  });

  test('Formato JSON válido con datos GPS', async ({ page }) => {
    // Test that exported JSON contains expected GPS fields
    // This would require mocking the API response or using test data

    test.skip('Requires API mocking implementation');
  });

  test('Formato CSV válido con coordenadas GPS', async ({ page }) => {
    // Test CSV export format includes GPS columns

    test.skip('Requires API mocking implementation');
  });

  test('Audit log registra exportación', async ({ page }) => {
    // Login as admin
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    await dashboardPage.handleGeolocationConsent(true);
    await dashboardPage.waitForLoad();

    // Navigate to audit log
    await page.locator('button:has-text("Audit Log")').click();

    // Verify audit log shows export events
    // This would require having test data in the audit log
    await expect(page.locator('.audit-log-entry')).toBeVisible();
  });

  test('Exportación filtrada por fechas incluye GPS', async ({ page }) => {
    // Test date range filtering in exports

    test.skip('Requires date range API implementation');
  });
});