import React, { useState } from 'react';
import { User, ShieldAlert, Mail, MapPin, Smartphone, Lock, Bell, Globe, Moon, Sun, Monitor, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PerfilTab({ profile, consentGiven, openRevokeModal, isSettings = false }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState('dark');
  const [language, setLanguage] = useState('es');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // If opened as "Ajustes", show settings-specific UI
  if (isSettings) {
    return (
      <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
        {/* Settings Header */}
        <div className="bg-[#111114] border border-white/5 rounded-[2rem] p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-white">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Ajustes de la Aplicación</h2>
              <p className="text-zinc-500 text-sm font-medium">Personaliza tu experiencia en Tempos</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-[#111114] border border-white/5 rounded-[2rem] p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Notificaciones</h3>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Alertas y Avisos</p>
            </div>
          </div>
          <div className="space-y-4">
            <ToggleRow 
              label="Notificaciones Push" 
              description="Recibe alertas en tiempo real sobre fichajes, ausencias y mensajes." 
              enabled={notificationsEnabled} 
              onChange={setNotificationsEnabled} 
            />
            <ToggleRow 
              label="Notificaciones por Email" 
              description="Recibe un resumen diario de la actividad en tu correo electrónico." 
              enabled={emailNotifications} 
              onChange={setEmailNotifications} 
            />
            <ToggleRow 
              label="Sonidos" 
              description="Reproducir un sonido al recibir notificaciones en la aplicación." 
              enabled={soundEnabled} 
              onChange={setSoundEnabled} 
            />
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-[#111114] border border-white/5 rounded-[2rem] p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Apariencia</h3>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Tema y visualización</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'dark', label: 'Oscuro', icon: Moon },
              { id: 'light', label: 'Claro', icon: Sun },
              { id: 'system', label: 'Sistema', icon: Monitor }
            ].map(theme => (
              <button
                key={theme.id}
                onClick={() => setDarkMode(theme.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  darkMode === theme.id 
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400" 
                    : "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/10"
                )}
              >
                <theme.icon className="w-5 h-5" />
                <span className="text-xs font-bold">{theme.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="bg-[#111114] border border-white/5 rounded-[2rem] p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Idioma y Región</h3>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Preferencias regionales</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Idioma de la interfaz</label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500/50 outline-none appearance-none"
              >
                <option value="es">🇪🇸 Español</option>
                <option value="en">🇬🇧 English</option>
                <option value="ca">Català</option>
                <option value="eu">Euskara</option>
                <option value="gl">Galego</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Zona Horaria</label>
              <div className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-sm text-white">
                Europe/Madrid (GMT+2)
              </div>
            </div>
          </div>
        </div>

        {/* Privacy (Geolocation) */}
        <div className="bg-[#111114] border border-white/5 rounded-[2rem] p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Privacidad</h3>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Datos y Consentimiento</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">Geolocalización</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  {consentGiven 
                    ? 'Consentimiento otorgado. Tu ubicación se registra al fichar.' 
                    : 'No has otorgado permisos de geolocalización.'}
                </p>
              </div>
              {consentGiven ? (
                <button
                  onClick={openRevokeModal}
                  className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold text-xs rounded-xl hover:bg-rose-500/20 transition-all whitespace-nowrap"
                >
                  Revocar
                </button>
              ) : (
                <span className="px-4 py-2 bg-white/5 border border-white/10 text-zinc-600 font-bold text-xs rounded-xl">
                  Sin permisos
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: Profile View
  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
       
       {/* Profile Header Card */}
       <div className="bg-[#111114] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />
         
         <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10">
            <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-5xl font-black text-white shadow-xl shadow-blue-600/20 border-4 border-[#0a0a0c]">
               {profile?.displayName?.charAt(0) || <User className="w-12 h-12" />}
            </div>
            
            <div className="text-center sm:text-left pt-2 flex-1">
               <h2 className="text-3xl font-black text-white tracking-tight">{profile?.displayName || 'Usuario Tempos'}</h2>
               <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                 <Mail className="w-4 h-4 text-zinc-500" />
                 <p className="text-zinc-400 font-medium">{profile?.email}</p>
               </div>
               
               <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-3">
                 <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] uppercase font-black tracking-widest">
                   Rol: {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'manager' ? 'Manager' : 'Empleado'}
                 </span>
                 <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase font-black tracking-widest">
                   Cuenta Activa
                 </span>
               </div>
            </div>
         </div>
       </div>

       {/* Privacy and Security Settings */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         
         {/* Geolocation */}
         <div className="bg-[#111114] border border-white/5 rounded-[2rem] p-8 shadow-xl flex flex-col">
           <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
               <MapPin className="w-5 h-5" />
             </div>
             <div>
               <h3 className="text-lg font-bold text-white">Geolocalización</h3>
               <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Privacidad de Ubicación</p>
             </div>
           </div>
           
           <div className="flex-1">
             <p className="text-sm text-zinc-400 leading-relaxed mb-6">
               {consentGiven 
                 ? 'Has otorgado permiso al sistema Tempos para capturar tus coordenadas GPS de forma segura durante el acto de fichaje. Esta información es requerida por tu empresa.' 
                 : 'Actualmente no has otorgado permisos de geolocalización. Las fichas desde dispositivos móviles podrían requerir aprobación o fallar.'}
             </p>
           </div>
           
           <div className="pt-6 border-t border-white/5 flex justify-end">
             {consentGiven ? (
               <button
                 onClick={openRevokeModal}
                 className="px-5 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold text-xs rounded-xl hover:bg-rose-500/20 transition-all flex items-center gap-2"
               >
                 <ShieldAlert className="w-4 h-4" />
                 Revocar Consentimiento
               </button>
             ) : (
               <div className="px-5 py-2.5 bg-white/5 border border-white/10 text-zinc-500 font-bold text-xs rounded-xl">
                 Sin Permisos
               </div>
             )}
           </div>
         </div>

         {/* Security */}
         <div className="bg-[#111114] border border-white/5 rounded-[2rem] p-8 shadow-xl flex flex-col">
           <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
               <Lock className="w-5 h-5" />
             </div>
             <div>
               <h3 className="text-lg font-bold text-white">Seguridad de la Cuenta</h3>
               <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Contraseñas y Sesión</p>
             </div>
           </div>
           
           <div className="flex-1 space-y-4">
             <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
               <div className="flex items-center gap-3">
                 <Smartphone className="w-4 h-4 text-zinc-400" />
                 <span className="text-sm font-medium text-white">Autenticación 2FA</span>
               </div>
               <span className="text-[10px] uppercase font-black tracking-widest text-zinc-600">Inactiva</span>
             </div>
             <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
               <div className="flex items-center gap-3">
                 <Lock className="w-4 h-4 text-zinc-400" />
                 <span className="text-sm font-medium text-white">Cambio de Contraseña</span>
               </div>
               <button className="text-[10px] uppercase font-black tracking-widest text-blue-400 hover:text-blue-300">Solicitar</button>
             </div>
           </div>
         </div>

       </div>
    </div>
  );
}

function ToggleRow({ label, description, enabled, onChange }) {
  return (
    <label className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
      <div className="flex-1">
        <h4 className="text-sm font-bold text-white">{label}</h4>
        <p className="text-xs text-zinc-400 mt-1">{description}</p>
      </div>
      <button 
        onClick={(e) => { e.preventDefault(); onChange(!enabled); }}
        className={cn(
          "w-10 h-6 rounded-full relative flex items-center shrink-0 transition-colors",
          enabled ? "bg-blue-600" : "bg-zinc-700"
        )}
      >
        <div className={cn(
          "w-4 h-4 bg-white rounded-full absolute shadow-sm transition-all",
          enabled ? "right-1" : "left-1"
        )} />
      </button>
    </label>
  );
}
