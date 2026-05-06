import { expect } from '@playwright/test';

/**
 * Page Object for Dashboard Page
 * Handles time tracking and GPS functionality
 */
export class DashboardPage {
  constructor(page) {
    this.page = page;
    this.clockInButton = page.locator('button:has-text("Clock In")');
    this.clockOutButton = page.locator('button:has-text("Clock Out")');
    this.currentTimeEntry = page.locator('.current-time-entry');
    this.mapContainer = page.locator('.map-container');
    this.geolocationModal = page.locator('.geolocation-consent-modal');
    this.consentAcceptButton = page.locator('button:has-text("Accept")');
    this.consentDenyButton = page.locator('button:has-text("Deny")');
    this.gpsStatus = page.locator('.gps-status');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async waitForLoad() {
    await this.page.waitForSelector('.dashboard-container');
  }

  async handleGeolocationConsent(accept = true) {
    // Wait for modal to appear
    await this.page.waitForSelector('.geolocation-consent-modal', { timeout: 5000 });

    if (accept) {
      await this.consentAcceptButton.click();
    } else {
      await this.consentDenyButton.click();
    }

    // Wait for modal to disappear
    await this.page.waitForSelector('.geolocation-consent-modal', { state: 'hidden' });
  }

  async clockIn() {
    await this.clockInButton.click();
    // Wait for success feedback or time entry update
    await this.page.waitForTimeout(1000);
  }

  async clockOut() {
    await this.clockOutButton.click();
    // Wait for success feedback or time entry update
    await this.page.waitForTimeout(1000);
  }

  async expectClockInSuccessful() {
    await expect(this.currentTimeEntry).toBeVisible();
    await expect(this.gpsStatus).toContainText('GPS captured');
  }

  async expectClockOutSuccessful() {
    await expect(this.currentTimeEntry).toBeVisible();
    await expect(this.gpsStatus).toContainText('Clocked out');
  }

  async expectGeolocationModalVisible() {
    await expect(this.geolocationModal).toBeVisible();
  }

  async expectMapVisible() {
    await expect(this.mapContainer).toBeVisible();
  }

  async expectGpsBlocked() {
    await expect(this.gpsStatus).toContainText('GPS access denied');
  }

  async setGeolocation(latitude, longitude, accuracy = 10) {
    await this.page.context().setGeolocation({ latitude, longitude, accuracy });
  }

  async grantGeolocationPermission() {
    await this.page.context().grantPermissions(['geolocation']);
  }

  async denyGeolocationPermission() {
    await this.page.context().clearPermissions();
  }
}