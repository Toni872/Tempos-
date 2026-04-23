/**
 * LocationService.ts
 * Proporciona lógica para cálculos geográficos.
 */

export class LocationService {
  /**
   * Calcula la distancia en metros entre dos coordenadas GPS usando la fórmula de Haversine.
   */
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance; // en metros
  }

  /**
   * Verifica si un punto está dentro de una geocerca definida por centro y radio.
   */
  static isWithinRadius(
    point: { lat: number; lng: number },
    center: { lat: number; lng: number },
    radiusMeters: number,
  ): boolean {
    const distance = this.calculateDistance(point.lat, point.lng, center.lat, center.lng);
    return distance <= radiusMeters;
  }
}
