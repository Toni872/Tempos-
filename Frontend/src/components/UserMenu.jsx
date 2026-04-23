
export default function UserMenu({ onLogout }) {
  return (
    <button
      type="button"
      className="tp-btn tp-btn-ghost"
      style={{ borderRadius: 10, padding: '8px 12px' }}
      onClick={onLogout}
    >
      Salir
    </button>
  );
}
