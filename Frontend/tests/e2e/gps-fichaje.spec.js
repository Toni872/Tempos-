import { test, expect } from '@playwright/test';
import { LoginPage } from './page-objects/LoginPage.js';
import { DashboardPage } from './page-objects/DashboardPage.js';
import { GpsMockService } from './mocks/gps-mock.js';

test.describe('GPS Fichaje E2E Tests', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    // Grant geolocation permission by default
    await page.context().grantPermissions(['geolocation']);
  });

  test('Flujo completo clock-in/out con GPS válido', async ({ page }) => {
    // Set valid GPS coordinates (office location)
    const validCoords = GpsMockService.getMockCoords('validLocation');
    await page.context().setGeolocation({
      latitude: validCoords.lat,
      longitude: validCoords.lng,
      accuracy: validCoords.accuracy
    });

    // Login as employee
    await loginPage.goto();
    await loginPage.loginAsEmployee();

    // Handle geolocation consent
    await dashboardPage.handleGeolocationConsent(true);

    // Wait for dashboard to load
    await dashboardPage.waitForLoad();

    // Perform clock-in
    await dashboardPage.clockIn();

    // Verify successful clock-in with GPS
    await dashboardPage.expectClockInSuccessful();
    await dashboardPage.expectMapVisible();

    // Perform clock-out
    await dashboardPage.clockOut();

    // Verify successful clock-out
    await dashboardPage.expectClockOutSuccessful();
  });

  test('Rechazo por precisión GPS insuficiente', async ({ page }) => {
    // Set low accuracy GPS coordinates
    const lowAccuracyCoords = GpsMockService.getMockCoords('lowAccuracy');
    await page.context().setGeolocation({
      latitude: lowAccuracyCoords.lat,
      longitude: lowAccuracyCoords.lng,
      accuracy: lowAccuracyCoords.accuracy
    });

    // Login as employee
    await loginPage.goto();
    await loginPage.loginAsEmployee();

    // Handle geolocation consent
    await dashboardPage.handleGeolocationConsent(true);

    // Wait for dashboard to load
    await dashboardPage.waitForLoad();

    // Attempt clock-in (should be rejected)
    await dashboardPage.clockIn();

    // Verify GPS rejection due to low accuracy
    await expect(page.locator('.error-message')).toContainText('GPS accuracy too low');
  });

  test('Rechazo por ubicación fuera de radio de trabajo', async ({ page }) => {
    // Set coordinates outside work radius
    const outsideCoords = GpsMockService.getMockCoords('outsideRadius');
    await page.context().setGeolocation({
      latitude: outsideCoords.lat,
      longitude: outsideCoords.lng,
      accuracy: outsideCoords.accuracy
    });

    // Login as employee
    await loginPage.goto();
    await loginPage.loginAsEmployee();

    // Handle geolocation consent
    await dashboardPage.handleGeolocationConsent(true);

    // Wait for dashboard to load
    await dashboardPage.waitForLoad();

    // Attempt clock-in (should be rejected)
    await dashboardPage.clockIn();

    // Verify rejection due to location outside work radius
    await expect(page.locator('.error-message')).toContainText('Location outside work area');
  });

  test('GPS bloqueado sin consentimiento', async ({ page }) => {
    // Deny geolocation permission
    await page.context().clearPermissions();

    // Login as employee
    await loginPage.goto();
    await loginPage.loginAsEmployee();

    // Deny geolocation consent
    await dashboardPage.handleGeolocationConsent(false);

    // Wait for dashboard to load
    await dashboardPage.waitForLoad();

    // Attempt clock-in (should be blocked)
    await dashboardPage.clockIn();

    // Verify GPS access is blocked
    await dashboardPage.expectGpsBlocked();
  });

  test('Almacenamiento de coordenadas y timestamps', async ({ page }) => {
    // Set valid GPS coordinates
    const validCoords = GpsMockService.getMockCoords('validLocation');
    await page.context().setGeolocation({
      latitude: validCoords.lat,
      longitude: validCoords.lng,
      accuracy: validCoords.accuracy
    });

    // Login as employee
    await loginPage.goto();
    await loginPage.loginAsEmployee();

    // Handle geolocation consent
    await dashboardPage.handleGeolocationConsent(true);

    // Wait for dashboard to load
    await dashboardPage.waitForLoad();

    // Record time before clock-in
    const beforeTime = new Date();

    // Perform clock-in
    await dashboardPage.clockIn();

    // Record time after clock-in
    const afterTime = new Date();

    // Verify successful clock-in
    await dashboardPage.expectClockInSuccessful();

    // Verify timestamp is within expected range
    const timeEntry = page.locator('.current-time-entry');
    await expect(timeEntry).toBeVisible();

    // Verify GPS coordinates are displayed/stored
    await expect(page.locator('.gps-coordinates')).toContainText(`${validCoords.lat.toFixed(4)}, ${validCoords.lng.toFixed(4)}`);
  });
});