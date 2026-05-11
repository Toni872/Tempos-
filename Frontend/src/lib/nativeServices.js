/**
 * nativeServices.js
 * Servicios nativos para la App móvil de Tempos.
 * Geolocalización, Device ID, y Geofencing.
 */

import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';

// ─── DEVICE ID ───────────────────────────────────────────────

const DEVICE_ID_KEY = 'tempos.hardware_device_id';

/**
 * Genera un ID único e inmutable para este dispositivo físico.
 * Se basa en datos de hardware + un UUID persistente.
 */
export async function getDeviceUniqueId() {
  // Intentar recuperar el ID ya generado
  const stored = localStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;

  try {
    const info = await Device.getId();
    // info.identifier es el UUID único del dispositivo en Capacitor
    const deviceId = info.identifier;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  } catch {
    // Fallback: generar un UUID persistente
    const fallbackId = `web-${crypto.randomUUID()}`;
    localStorage.setItem(DEVICE_ID_KEY, fallbackId);
    return fallbackId;
  }
}

// ─── GEOLOCATION ─────────────────────────────────────────────

/**
 * Obtiene la posición actual del dispositivo con alta precisión.
 * @returns {{ lat: number, lng: number, accuracy: number }} | null
 */
export async function getCurrentPosition() {
  try {
    // Verificar permisos
    const permStatus = await Geolocation.checkPermissions();

    if (permStatus.location !== 'granted') {
      const requested = await Geolocation.requestPermissions();
      if (requested.location !== 'granted') {
        console.warn('⚠️ [GEO] Permisos de ubicación denegados');
        return null;
      }
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000, // Caché de 30 segundos
    });

    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  } catch (err) {
    console.error('❌ [GEO] Error al obtener ubicación:', err);
    return null;
  }
}

// ─── GEOFENCING ──────────────────────────────────────────────

/**
 * Calcula la distancia entre dos coordenadas GPS (Haversine).
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radio de la Tierra en metros
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // metros
}

/**
 * Verifica si la posición actual está dentro del radio de un centro de trabajo.
 * @param {object} position - { lat, lng }
 * @param {object} workCenter - { latitude, longitude, radiusMeters }
 * @returns {{ isInside: boolean, distanceMeters: number }}
 */
export function checkGeofence(position, workCenter) {
  if (!position || !workCenter?.latitude || !workCenter?.longitude) {
    return { isInside: false, distanceMeters: Infinity };
  }

  const distance = haversineDistance(
    position.lat,
    position.lng,
    Number(workCenter.latitude),
    Number(workCenter.longitude)
  );

  return {
    isInside: distance <= (workCenter.radiusMeters || 100),
    distanceMeters: Math.round(distance),
  };
}

/**
 * Verifica la posición contra TODOS los centros de trabajo de la empresa.
 * @param {object} position - { lat, lng }
 * @param {Array} workCenters - Array de centros con latitude, longitude, radiusMeters
 * @returns {{ isInside: boolean, nearestCenter: object|null, distanceMeters: number }}
 */
export function checkGeofenceAgainstCenters(position, workCenters) {
  if (!position || !workCenters?.length) {
    return { isInside: false, nearestCenter: null, distanceMeters: Infinity };
  }

  let nearestCenter = null;
  let minDistance = Infinity;
  let isInside = false;

  for (const center of workCenters) {
    const result = checkGeofence(position, center);
    if (result.distanceMeters < minDistance) {
      minDistance = result.distanceMeters;
      nearestCenter = center;
    }
    if (result.isInside) {
      isInside = true;
      nearestCenter = center;
      minDistance = result.distanceMeters;
      break; // Ya encontramos uno válido
    }
  }

  return { isInside, nearestCenter, distanceMeters: minDistance };
}

// ─── HAPTICS (Feedback táctil) ───────────────────────────────

/**
 * Vibración de confirmación (fichaje exitoso).
 */
export async function hapticSuccess() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch { /* silencioso en web */ }
}

/**
 * Vibración de error (fichaje rechazado).
 */
export async function hapticError() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch { /* silencioso en web */ }
}

/**
 * Vibración suave de interacción.
 */
export async function hapticImpact() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch { /* silencioso en web */ }
}

// ─── LOCAL NOTIFICATIONS ─────────────────────────────────────

/**
 * Muestra una notificación local al usuario (sin server push).
 * Ideal para confirmar fichajes automáticos.
 */
export async function showLocalNotification(title, body) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const permStatus = await LocalNotifications.checkPermissions();
    if (permStatus.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now(),
          title,
          body,
          schedule: { at: new Date(Date.now() + 500) }, // Inmediata
          sound: 'default',
        },
      ],
    });
  } catch (err) {
    console.warn('⚠️ [NOTIF] Error al mostrar notificación:', err);
  }
}

// ─── AUTO CLOCK SERVICE ──────────────────────────────────────

/**
 * Servicio completo de fichaje automático.
 * 1. Obtiene la ubicación del dispositivo
 * 2. Verifica contra los centros de trabajo
 * 3. Envía el fichaje al servidor si está dentro del radio
 * 4. Notifica al usuario
 *
 * @param {object} params - { token, workCenters, clockInFn, clockOutFn, isCurrentlyClockedIn }
 */
export async function autoClockCheck({
  token,
  workCenters,
  clockInFn,
  clockOutFn,
  isCurrentlyClockedIn,
}) {
  const deviceId = await getDeviceUniqueId();
  const position = await getCurrentPosition();

  if (!position) {
    console.log('📍 [AUTO-CLOCK] No se pudo obtener ubicación. Abortando.');
    return { action: 'none', reason: 'no_location' };
  }

  const { isInside, nearestCenter, distanceMeters } = checkGeofenceAgainstCenters(
    position,
    workCenters
  );

  console.log(`📍 [AUTO-CLOCK] Posición: ${position.lat}, ${position.lng} | Dentro: ${isInside} | Distancia: ${distanceMeters}m`);

  if (isInside && !isCurrentlyClockedIn) {
    // ✅ Entró en la geocerca → FICHAR ENTRADA
    try {
      await clockInFn(token, {
        deviceId,
        location: { lat: position.lat, lng: position.lng },
      });
      await hapticSuccess();
      await showLocalNotification(
        '✅ Entrada registrada',
        `Bienvenido a ${nearestCenter?.name || 'tu centro de trabajo'}. Tu fichaje ha sido registrado automáticamente.`
      );
      return { action: 'clock_in', center: nearestCenter?.name };
    } catch (err) {
      await hapticError();
      console.error('❌ [AUTO-CLOCK] Error al fichar entrada:', err);
      return { action: 'error', reason: err.message };
    }
  }

  if (!isInside && isCurrentlyClockedIn) {
    // 🚪 Salió de la geocerca → FICHAR SALIDA
    try {
      await clockOutFn(token, {
        deviceId,
        location: { lat: position.lat, lng: position.lng },
      });
      await hapticSuccess();
      await showLocalNotification(
        '🚪 Salida registrada',
        `Has salido de ${nearestCenter?.name || 'tu centro de trabajo'}. Tu fichaje de salida ha sido registrado.`
      );
      return { action: 'clock_out', center: nearestCenter?.name };
    } catch (err) {
      await hapticError();
      console.error('❌ [AUTO-CLOCK] Error al fichar salida:', err);
      return { action: 'error', reason: err.message };
    }
  }

  return { action: 'none', reason: isInside ? 'already_clocked_in' : 'outside_geofence' };
}
