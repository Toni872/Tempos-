import { useState, useEffect, useCallback } from 'react';

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  // Check if user has already given consent
  useEffect(() => {
    const consent = localStorage.getItem('geolocation-consent');
    const consentDate = localStorage.getItem('geolocation-consent-date');

    if (consent === 'accepted' && consentDate) {
      // Check if consent is still valid (not older than 1 year)
      const consentDateObj = new Date(consentDate);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      if (consentDateObj > oneYearAgo) {
        setConsentGiven(true);
      } else {
        // Consent expired, remove it
        localStorage.removeItem('geolocation-consent');
        localStorage.removeItem('geolocation-consent-date');
      }
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!consentGiven) {
      setError('Se requiere consentimiento para acceder a la ubicación');
      return;
    }

    if (!navigator.geolocation) {
      setError('La geolocalización no está soportada por este navegador');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        setLocation(coords);
        setLoading(false);
      },
      (err) => {
        let errorMessage = 'Error al obtener la ubicación';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado por el usuario';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Información de ubicación no disponible';
            break;
          case err.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado para obtener ubicación';
            break;
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [consentGiven]);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  const revokeConsent = useCallback(() => {
    localStorage.removeItem('geolocation-consent');
    localStorage.removeItem('geolocation-consent-date');
    setConsentGiven(false);
    setLocation(null);
    setError(null);
  }, []);

  return {
    location,
    error,
    loading,
    consentGiven,
    requestLocation,
    clearLocation,
    revokeConsent,
  };
}