import { useState } from 'react';

export default function EmpleadoForm({ initialValues = {}, onSubmit, onCancel, loading, mode = 'add' }) {
  const [activeTab, setActiveTab] = useState('general');
  
  // State
  const [formData, setFormData] = useState({
    email: initialValues.email || '',
    displayName: initialValues.displayName || initialValues.nombre || initialValues.name || '',
    role: initialValues.role || initialValues.rol || 'employee',
    status: initialValues.status || 'active',
    // New fields
    requiresGeolocation: initialValues.requiresGeolocation ?? false,
    requiresKioskOnly: initialValues.requiresKioskOnly ?? false,
    pushNotifications: initialValues.pushNotifications ?? false,
    autoClock: initialValues.autoClock ?? false,
    qrClock: initialValues.qrClock ?? false,
    kioskPin: initialValues.kioskPin || '',
    hourlyRate: initialValues.hourlyRate || 0,
    overtimeRate: initialValues.overtimeRate || 0,
  });

  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!formData.displayName.trim() || (mode === 'add' && !formData.email.trim())) {
      setError('Nombre y Email son campos obligatorios.');
      return;
    }
    setError('');
    
    // Convert strings to numbers for rates
    const submissionData = {
      ...formData,
      hourlyRate: Number(formData.hourlyRate),
      overtimeRate: Number(formData.overtimeRate),
    };
    
    onSubmit(submissionData);
  };

  const tabs = [
    { id: 'general', label: 'Datos Generales', icon: '👤' },
    { id: 'fichaje', label: 'Configuración de Fichaje', icon: '⏰' },
    { id: 'seguridad', label: 'Seguridad y Acceso', icon: '🔒' },
    { id: 'finanzas', label: 'Finanzas / Costes', icon: '💰' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg">
      {/* Tab Navigation */}
      <div className="flex border-b border-white/5 gap-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium transition-all relative ${
              activeTab === tab.id ? 'text-blue-400' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            )}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {activeTab === 'general' && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {mode === 'add' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider ml-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className="bg-[#191919] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors"
                  placeholder="ejemplo@empresa.com"
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider ml-1">Nombre Completo</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={e => handleChange('displayName', e.target.value)}
                className="bg-[#191919] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors"
                placeholder="Nombre y Apellidos"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider ml-1">Rol en la Organización</label>
              <select
                value={formData.role}
                onChange={e => handleChange('role', e.target.value)}
                className="bg-[#191919] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="employee">Empleado Estándar</option>
                <option value="manager">Responsable / Manager</option>
                <option value="admin">Administrador del Sistema</option>
                <option value="auditor">Auditor Externo</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'seguridad' && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between p-4 bg-[#191919] border border-white/5 rounded-2xl">
              <div>
                <div className="font-semibold text-white text-sm">Geolocalización Obligatoria</div>
                <div className="text-xs text-white/40">Exige permisos GPS en cada ficha</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.requiresGeolocation}
                  onChange={e => handleChange('requiresGeolocation', e.target.checked)}
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/60 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#191919] border border-white/5 rounded-2xl">
              <div>
                <div className="font-semibold text-white text-sm">Solo fichar en punto de fichaje</div>
                <div className="text-xs text-white/40">Restringe el fichaje a zonas autorizadas</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.requiresKioskOnly}
                  onChange={e => handleChange('requiresKioskOnly', e.target.checked)}
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/60 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#191919] border border-white/5 rounded-2xl">
              <div>
                <div className="font-semibold text-white text-sm">Recibir notificación push</div>
                <div className="text-xs text-white/40">Alertas en tiempo real en el móvil</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.pushNotifications}
                  onChange={e => handleChange('pushNotifications', e.target.checked)}
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/60 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#191919] border border-white/5 rounded-2xl">
              <div>
                <div className="font-semibold text-white text-sm">Fichaje con QR</div>
                <div className="text-xs text-white/40">Uso de códigos físicos para fichaje</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.qrClock}
                  onChange={e => handleChange('qrClock', e.target.checked)}
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/60 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
              </label>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider ml-1">PIN Modo Kiosko (Opcional)</label>
              <input
                type="text"
                maxLength={10}
                value={formData.kioskPin}
                onChange={e => handleChange('kioskPin', e.target.value.replace(/\D/g, ''))}
                className="bg-[#191919] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors font-mono tracking-[0.5em]"
                placeholder="4-10 dígitos"
              />
              <p className="text-[11px] text-white/30 ml-1">Para fichar en tablets compartidas sin login de Google.</p>
            </div>
          </div>
        )}

        {activeTab === 'finanzas' && (
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl mb-2">
              <p className="text-xs text-blue-400 leading-relaxed">
                Establece las tarifas para cálculos automáticos de costes en informes. Estos datos son privados y solo visibles para administradores.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider ml-1">Coste Hora Ordinaria</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">€</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={e => handleChange('hourlyRate', e.target.value)}
                    className="w-full bg-[#191919] border border-white/10 text-white rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider ml-1">Coste Hora Extra</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">€</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.overtimeRate}
                    onChange={e => handleChange('overtimeRate', e.target.value)}
                    className="w-full bg-[#191919] border border-white/10 text-white rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-4 border-t border-white/5 pt-6">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Sincronizando...' : mode === 'edit' ? 'Actualizar Perfil' : 'Crear Empleado'}
          </button>
          <button
            type="button"
            className="px-6 bg-[#191919] hover:bg-[#222] text-white/60 font-semibold py-3 rounded-xl transition-colors border border-white/5"
            onClick={onCancel}
            disabled={loading}
          >
            Cerrar
          </button>
        </div>
      </form>
    </div>
  );
}
