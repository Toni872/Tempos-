/**
 * useAutoClock.js
 * Hook que gestiona el fichaje automático por geofencing.
 * Se ejecuta al abrir el Dashboard y periódicamente en segundo plano.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  autoClockCheck,
  getDeviceUniqueId,
  getCurrentPosition,
  checkGeofenceAgainstCenters,
  hapticImpact,
} from '@/lib/nativeServices';
import { getClientSession } from '@/lib/api';

const AUTO_CLOCK_INTERVAL_MS = 60_000; // Comprobar cada 60 segundos

/**
 * @param {object} params
 * @param {Array} params.workCenters - Lista de centros de trabajo con lat/lng/radius
 * @param {boolean} params.clockedIn - Si el usuario ya tiene un fichaje activo
 * @param {Function} params.clockInFn - Función clockIn(token, payload)
 * @param {Function} params.clockOutFn - Función clockOut(token, payload)
 * @param {Function} params.onClockAction - Callback cuando ocurre un fichaje automático
 * @param {boolean} params.enabled - Si el auto-clock está habilitado
 */
export function useAutoClock({
  workCenters,
  clockedIn,
  clockInFn,
  clockOutFn,
  onClockAction,
  enabled = true,
}) {
  const [autoClockStatus, setAutoClockStatus] = useState('idle'); // idle | checking | inside | outside
  const [lastCheck, setLastCheck] = useState(null);
  const [nearestCenter, setNearestCenter] = useState(null);
  const [distanceMeters, setDistanceMeters] = useState(null);
  const intervalRef = useRef(null);
  const isCheckingRef = useRef(false);

  const runCheck = useCallback(async () => {
    // Evitar checks simultáneos
    if (isCheckingRef.current) return;
    if (!enabled || !Capacitor.isNativePlatform()) return;
    if (!workCenters || workCenters.length === 0) return;

    const session = getClientSession();
    if (!session?.token) return;

    isCheckingRef.current = true;
    setAutoClockStatus('checking');

    try {
      const result = await autoClockCheck({
        token: session.token,
        workCenters,
        clockInFn,
        clockOutFn,
        isCurrentlyClockedIn: clockedIn,
      });

      setLastCheck(new Date());

      if (result.action === 'clock_in' || result.action === 'clock_out') {
        console.log(`🔔 [AUTO-CLOCK] Acción ejecutada: ${result.action} en ${result.center}`);
        onClockAction?.(result);
      }

      // Actualizar estado de proximidad
      const position = await getCurrentPosition();
      if (position) {
        const geoResult = checkGeofenceAgainstCenters(position, workCenters);
        setAutoClockStatus(geoResult.isInside ? 'inside' : 'outside');
        setNearestCenter(geoResult.nearestCenter);
        setDistanceMeters(geoResult.distanceMeters);
      }
    } catch (err) {
      console.error('❌ [AUTO-CLOCK] Error en verificación:', err);
      setAutoClockStatus('idle');
    } finally {
      isCheckingRef.current = false;
    }
  }, [enabled, workCenters, clockedIn, clockInFn, clockOutFn, onClockAction]);

  // Ejecución inicial al montar + intervalo periódico
  useEffect(() => {
    if (!enabled || !Capacitor.isNativePlatform()) return;

    // Primera verificación al abrir la app (con delay para que carguen datos)
    const initialTimeout = setTimeout(() => {
      runCheck();
    }, 3000);

    // Comprobaciones periódicas
    intervalRef.current = setInterval(runCheck, AUTO_CLOCK_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, runCheck]);

  return {
    autoClockStatus,
    lastCheck,
    nearestCenter,
    distanceMeters,
    runCheck, // Para forzar una comprobación manual
  };
}
