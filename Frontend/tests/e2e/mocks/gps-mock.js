/**
 * GPS Mock Service for E2E Testing
 * Provides realistic GPS coordinates and scenarios for testing
 */

export class GpsMockService {
  // Work center locations (Madrid area)
  static WORK_CENTERS = {
    office: { lat: 40.4168, lng: -3.7038, radius: 100 }, // Madrid center
    warehouse: { lat: 40.4200, lng: -3.7100, radius: 50 }, // Near office
    remote: { lat: 40.4300, lng: -3.7200, radius: 200 }, // Further location
  };

  // Test scenarios
  static SCENARIOS = {
    validLocation: {
      name: 'Valid Office Location',
      coords: { lat: 40.4170, lng: -3.7040, accuracy: 8 }, // Within office radius
      expected: 'success'
    },
    lowAccuracy: {
      name: 'Low Accuracy GPS',
      coords: { lat: 40.4170, lng: -3.7040, accuracy: 25 }, // Below 10m threshold
      expected: 'rejected'
    },
    outsideRadius: {
      name: 'Outside Work Radius',
      coords: { lat: 40.4500, lng: -3.7500, accuracy: 5 }, // Far from any work center
      expected: 'rejected'
    },
    warehouseLocation: {
      name: 'Valid Warehouse Location',
      coords: { lat: 40.4205, lng: -3.7105, accuracy: 6 }, // Within warehouse radius
      expected: 'success'
    },
    noPermission: {
      name: 'No GPS Permission',
      coords: null, // No coordinates available
      expected: 'blocked'
    }
  };

  /**
   * Get mock coordinates for a specific scenario
   */
  static getMockCoords(scenario) {
    const scenarioData = this.SCENARIOS[scenario];
    if (!scenarioData) {
      throw new Error(`Unknown GPS scenario: ${scenario}`);
    }
    return scenarioData.coords;
  }

  /**
   * Get all available scenarios
   */
  static getScenarios() {
    return Object.keys(this.SCENARIOS);
  }

  /**
   * Check if coordinates are within any work center radius
   */
  static isWithinWorkRadius(lat, lng) {
    for (const [name, center] of Object.entries(this.WORK_CENTERS)) {
      const distance = this.calculateDistance(lat, lng, center.lat, center.lng);
      if (distance <= center.radius) {
        return { valid: true, workCenter: name, distance };
      }
    }
    return { valid: false, distance: null };
  }

  /**
   * Calculate distance between two GPS coordinates in meters
   * Using Haversine formula
   */
  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Generate random coordinates within a work center
   */
  static generateRandomCoordsInRadius(centerName, maxOffset = 50) {
    const center = this.WORK_CENTERS[centerName];
    if (!center) {
      throw new Error(`Unknown work center: ${centerName}`);
    }

    // Generate random offset within radius
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * maxOffset;

    // Convert to lat/lng offset (approximate)
    const latOffset = (distance / 111000) * Math.cos(angle); // 1 degree lat ≈ 111km
    const lngOffset = (distance / 111000) * Math.sin(angle) / Math.cos(this.toRadians(center.lat));

    return {
      lat: center.lat + latOffset,
      lng: center.lng + lngOffset,
      accuracy: Math.random() * 10 + 5 // 5-15m accuracy
    };
  }

  /**
   * Generate test data for multiple scenarios
   */
  static generateTestData() {
    const testData = {};

    for (const [scenario, data] of Object.entries(this.SCENARIOS)) {
      testData[scenario] = {
        ...data,
        workCenterCheck: data.coords ?
          this.isWithinWorkRadius(data.coords.lat, data.coords.lng) :
          { valid: false }
      };
    }

    return testData;
  }
}