import { useState, useEffect } from 'react';

export default function GeolocationConsentModal({ isOpen, onAccept, onDeny, showRevokeOption = false, onRevoke }) {
  const [showModal, setShowModal] = useState(isOpen);

  useEffect(() => {
    setShowModal(isOpen);
  }, [isOpen]);

  if (!showModal) return null;

  const handleAccept = () => {
    localStorage.setItem('geolocation-consent', 'accepted');
    localStorage.setItem('geolocation-consent-date', new Date().toISOString());
    setShowModal(false);
    onAccept();
  };

  const handleDeny = () => {
    localStorage.setItem('geolocation-consent', 'denied');
    localStorage.setItem('geolocation-consent-date', new Date().toISOString());
    setShowModal(false);
    onDeny();
  };

  const handleRevoke = () => {
    localStorage.setItem('geolocation-consent', 'denied');
    localStorage.setItem('geolocation-consent-date', new Date().toISOString());
    setShowModal(false);
    if (onRevoke) onRevoke();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 p-2 rounded-full mr-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Consentimiento de Geolocalización</h2>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            <strong>Tempos</strong> requiere acceso a tu ubicación para registrar tus fichajes de jornada laboral de acuerdo con la normativa española (Real Decreto-ley 8/2019).
          </p>

          <div className="bg-blue-50 p-3 rounded-lg mb-3">
            <h3 className="font-semibold text-blue-900 mb-2">¿Para qué usamos tu ubicación?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Verificar que los fichajes se realizan desde ubicaciones autorizadas</li>
              <li>• Garantizar la integridad del registro de jornada laboral</li>
              <li>• Cumplir con requisitos legales de trazabilidad</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg mb-3">
            <h3 className="font-semibold text-gray-900 mb-2">Privacidad y Protección de Datos</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Los datos se almacenan exclusivamente en servidores de la UE</li>
              <li>• Se conservan durante 4 años según normativa laboral española</li>
              <li>• Solo personal autorizado puede acceder a tus datos</li>
              <li>• Puedes revocar este consentimiento en cualquier momento</li>
            </ul>
          </div>

          <p className="text-xs text-gray-500">
            Al aceptar, consientes el tratamiento de tus datos de geolocalización según nuestra{' '}
            <a href="/privacy-policy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              Política de Privacidad
            </a>{' '}
            y{' '}
            <a href="/terms-of-service" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              Términos de Servicio
            </a>.
          </p>
        </div>

        <div className="flex space-x-3">
          {showRevokeOption ? (
            <button
              onClick={handleRevoke}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              Revocar Consentimiento
            </button>
          ) : (
            <>
              <button
                onClick={handleDeny}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Denegar
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Aceptar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}