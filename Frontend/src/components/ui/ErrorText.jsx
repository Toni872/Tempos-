/**
 * Componente reutilizable para mostrar errores de validación inline.
 * Se usa en AuthPage, TrialPage y cualquier formulario que necesite
 * feedback visual de errores con accesibilidad (role="alert").
 */
export default function ErrorText({ id, message }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} role="alert" aria-live="polite" style={{ marginTop: 6, fontSize: 12.5, color: '#ef4444', fontWeight: 500 }}>
      {message}
    </p>
  );
}
