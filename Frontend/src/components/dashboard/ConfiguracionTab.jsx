import React, { useState } from 'react';
import { LayoutDashboard, Building2, Globe, CreditCard, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ConfiguracionTab({ profile, isAdmin }) {
  const [activeSection, setActiveSection] = useState('empresa');

  if (!isAdmin) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-zinc-800 mx-auto" />
          <h2 className="text-xl font-bold text-white">Acceso Restringido</h2>
          <p className="text-zinc-500">Solo los administradores pueden modificar la configuración de la empresa.</p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'empresa', name: 'Datos Fiscales', icon: Building2 },
    { id: 'fichajes', name: 'Políticas de Fichaje', icon: Clock },
    { id: 'apariencia', name: 'Personalización', icon: Globe },
    { id: 'facturacion', name: 'Plan y Facturación', icon: CreditCard }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111114] border border-white/5 p-6 rounded-[2rem] shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-white shadow-xl">
            <LayoutDashboard className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Configuración del Espacio</h2>
            <p className="text-zinc-500 text-sm font-medium">Administra los parámetros globales de la organización</p>
          </div>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-blue-600/20 transition-all">
          Guardar Cambios
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Local */}
        <div className="lg:col-span-1 space-y-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-sm border",
                activeSection === section.id 
                  ? "bg-[#111114] border-white/10 text-white shadow-xl" 
                  : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              )}
            >
              <section.icon className={cn("w-5 h-5", activeSection === section.id ? "text-blue-500" : "")} />
              {section.name}
            </button>
          ))}
        </div>

        {/* Área de Configuración */}
        <div className="lg:col-span-3 bg-[#111114] border border-white/5 rounded-[2rem] p-8 shadow-xl min-h-[500px]">
          
          {activeSection === 'empresa' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-white mb-6 pb-4 border-b border-white/5">Datos Fiscales y Razón Social</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nombre de la Empresa</label>
                  <input type="text" defaultValue="Empresa Demo S.L." className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500/50 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">CIF / NIF</label>
                  <input type="text" defaultValue="B12345678" className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500/50 outline-none" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Dirección Fiscal</label>
                  <input type="text" defaultValue="Calle Principal 123, Madrid" className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500/50 outline-none" />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'fichajes' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-white mb-6 pb-4 border-b border-white/5">Reglas y Políticas de Fichaje</h3>
              
              <div className="space-y-4">
                <label className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white">Geofichaje Obligatorio</h4>
                    <p className="text-xs text-zinc-400 mt-1">Los empleados solo podrán fichar si se encuentran dentro del radio de sus sedes asignadas.</p>
                  </div>
                  <div className="w-10 h-6 bg-blue-600 rounded-full relative flex items-center shrink-0">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-1 shadow-sm" />
                  </div>
                </label>

                <label className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white">Fichaje por IP Restringida</h4>
                    <p className="text-xs text-zinc-400 mt-1">Bloquear el fichaje desde redes externas no reconocidas por el sistema.</p>
                  </div>
                  <div className="w-10 h-6 bg-zinc-700 rounded-full relative flex items-center shrink-0">
                    <div className="w-4 h-4 bg-white rounded-full absolute left-1 shadow-sm" />
                  </div>
                </label>

                <label className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white">Recordatorios Push</h4>
                    <p className="text-xs text-zinc-400 mt-1">Enviar notificaciones a la app móvil 10 minutos antes del fin de turno.</p>
                  </div>
                  <div className="w-10 h-6 bg-blue-600 rounded-full relative flex items-center shrink-0">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-1 shadow-sm" />
                  </div>
                </label>
              </div>
            </div>
          )}

          {activeSection === 'apariencia' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <h3 className="text-lg font-bold text-white mb-6 pb-4 border-b border-white/5">Marca Blanca</h3>
               <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                 <Globe className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                 <h4 className="text-white font-bold mb-2">Sube el logotipo de tu empresa</h4>
                 <p className="text-zinc-500 text-sm mb-6">Se mostrará en la app de tus empleados y en los informes PDF.</p>
                 <button className="bg-white text-black px-6 py-2 rounded-lg font-bold text-sm">Examinar...</button>
               </div>
            </div>
          )}

          {activeSection === 'facturacion' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <h3 className="text-lg font-bold text-white mb-6 pb-4 border-b border-white/5">Plan Actual: Tempos Premium</h3>
               
               <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-2xl p-6">
                 <div className="flex justify-between items-center mb-6">
                   <div>
                     <h4 className="text-2xl font-black text-white">125 / 500</h4>
                     <p className="text-blue-200 text-sm">Licencias de empleados activas</p>
                   </div>
                   <div className="text-right">
                     <p className="text-sm text-zinc-400">Próximo ciclo:</p>
                     <p className="text-white font-bold">1 de Enero, 2027</p>
                   </div>
                 </div>
                 <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                   <div className="w-1/4 h-full bg-blue-500 rounded-full" />
                 </div>
               </div>

               <div className="flex justify-end gap-4 pt-6">
                 <button className="px-6 py-2 bg-white/5 text-white font-bold text-sm rounded-lg hover:bg-white/10">Gestionar Tarjeta</button>
                 <button className="px-6 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-500">Ampliar Licencias</button>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
