import React from 'react';
import { User, ShieldAlert, Mail, MapPin, Smartphone, Lock } from 'lucide-react';

export default function PerfilTab({ profile, consentGiven, openRevokeModal }) {
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
                   Rol: {profile?.role === 'admin' ? 'Administrador' : 'Empleado'}
                 </span>
                 <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 text-[10px] uppercase font-black tracking-widest">
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
