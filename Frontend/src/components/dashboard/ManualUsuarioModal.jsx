import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  House, 
  NavigationArrow, 
  UsersThree, 
  ClipboardText, 
  Buildings, 
  ClockCountdown, 
  CalendarX, 
  FileDoc, 
  ChartLineUp, 
  CurrencyCircleDollar, 
  ChatTeardrop, 
  GearSix, 
  ShieldCheck, 
  UserCircleGear 
} from '@phosphor-icons/react';

const sections = [
  {
    title: "Módulo Principal",
    items: [
      { id: 'inicio', title: 'Inicio', icon: House, description: 'El centro de mandos (Dashboard).', features: ['Vista panorámica de empleados activos.', 'Botones rápidos de Entrada y Salida.', 'Atajos a tareas pendientes.'] },
      { id: 'geomapa', title: 'GeoMapa', icon: NavigationArrow, description: 'Visualización geoespacial.', features: ['Requiere consentimiento de geolocalización.', 'Muestra desde dónde fichan los empleados.'] },
      { id: 'equipo', title: 'Equipo', icon: UsersThree, description: 'Directorio de trabajadores.', features: ['Alta, baja y modificación de empleados.', 'Acceso al expediente de cada empleado.'] },
      { id: 'registros', title: 'Registros', icon: ClipboardText, description: 'El corazón del control horario.', features: ['Listado (Timesheet) de todos los fichajes.', 'Gestión de correcciones de fichajes olvidados.'] },
      { id: 'sedes', title: 'Sedes', icon: Buildings, description: 'Centros de trabajo físicos.', features: ['Geofencing con Latitud/Longitud y radio.', 'Permite fichaje automático (Auto-Clock).'] },
      { id: 'horarios', title: 'Horarios', icon: ClockCountdown, description: 'Gestión de la jornada.', features: ['Creación de plantillas (ej. 08:00 - 15:00).', 'Asignación de turnos en calendario.'] },
      { id: 'ausencias', title: 'Ausencias', icon: CalendarX, description: 'Vacaciones y permisos.', features: ['Solicitud de días libres.', 'Aprobación o denegación por parte de Admin.'] },
      { id: 'documentos', title: 'Documentos', icon: FileDoc, description: 'Gestor documental.', features: ['Repositorio seguro para contratos.', 'Asignación individual o global.'] }
    ]
  },
  {
    title: "Análisis y Reportes",
    items: [
      { id: 'analisis', title: 'Análisis', icon: ChartLineUp, description: 'Métricas laborales.', features: ['Gráficas de rendimiento y horas.', 'Tendencias de absentismo.'] },
      { id: 'informes', title: 'Informes', icon: ClipboardText, description: 'Inspecciones de Trabajo.', features: ['Exportación de registros a PDF/Excel.', 'Trazabilidad y firmas válidas.'] },
      { id: 'nominas', title: 'Nóminas', icon: CurrencyCircleDollar, description: 'Recibos de salario.', features: ['Distribución privada por trabajador.', 'Descarga confidencial.'] },
      { id: 'mensajes', title: 'Mensajes', icon: ChatTeardrop, description: 'Comunicación interna.', features: ['Envío de comunicados.', 'Notificaciones en el panel.'] }
    ]
  },
  {
    title: "Configuración",
    items: [
      { id: 'empresa', title: 'Mi Empresa', icon: GearSix, description: 'Ajustes globales.', features: ['Datos fiscales, logo y zona horaria.'] },
      { id: 'legal', title: 'Legal', icon: ShieldCheck, description: 'Cumplimiento Normativo.', features: ['Control LOPD y RGPD.', 'Registro inalterable y Audit Trail.'] },
      { id: 'perfil', title: 'Mi Perfil', icon: UserCircleGear, description: 'Gestión personal.', features: ['Cambio de contraseña.', 'Consentimientos de privacidad.'] }
    ]
  }
];

export default function ManualUsuarioModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl max-h-[85vh] bg-[#0d0d0f] border border-white/[0.08] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/[0.08] bg-[#0a0a0c]/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                <FileDoc size={24} weight="duotone" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Manual de Usuario</h2>
                <p className="text-xs text-zinc-400 font-medium">Guía oficial de uso de Tempos HR</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors border border-white/5 hover:border-white/10"
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-10">
            <div className="prose prose-invert max-w-none">
              <p className="text-sm text-zinc-300 leading-relaxed bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                Bienvenido al panel de gestión de <strong>Tempos HR</strong>. Esta guía está diseñada para ayudarte a entender la funcionalidad de cada módulo, ya seas un administrador configurando la empresa o un empleado gestionando su jornada.
              </p>
            </div>

            {sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-6">
                <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">
                  {section.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                            <Icon size={16} weight="fill" />
                          </div>
                          <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">{item.title}</h4>
                        </div>
                        <p className="text-xs text-zinc-400 font-medium mb-3">{item.description}</p>
                        <ul className="space-y-1.5">
                          {item.features.map((feat, fIdx) => (
                            <li key={fIdx} className="text-[11px] text-zinc-500 flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span className="leading-snug">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-white/[0.08] bg-[#0a0a0c]/80 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors border border-white/5"
            >
              Cerrar Manual
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
