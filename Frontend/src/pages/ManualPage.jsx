import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
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
  UserCircleGear,
  CheckCircle,
  Info
} from '@phosphor-icons/react';
import Logo from '@/components/ui/Logo';

const MANUAL_SECTIONS = [
  {
    category: 'Módulo Principal',
    items: [
      {
        id: 'inicio',
        title: 'Inicio (Dashboard)',
        icon: House,
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Inicio (Dashboard)</h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              El panel de Inicio es tu centro de mandos. Aquí tendrás una visión instantánea de lo que ocurre en tu empresa en tiempo real.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                <CheckCircle weight="fill" /> ¿Qué debes hacer aquí?
              </h3>
              <ul className="space-y-4 text-zinc-200 text-base">
                <li><strong className="text-white">Si eres Empleado:</strong> Nada más entrar, utiliza los botones gigantes de "Entrada" y "Salida" para registrar tu jornada. Si tienes un descanso, usa el botón de pausa.</li>
                <li><strong className="text-white">Si eres Administrador:</strong> Revisa el panel de "Empleados Activos" para saber quién está trabajando en este momento. Observa las notificaciones de ausencias pendientes de aprobar para mantener todo al día.</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'geomapa',
        title: 'GeoMapa',
        icon: NavigationArrow,
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">GeoMapa</h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              La sección GeoMapa te permite visualizar en un mapa interactivo las ubicaciones exactas desde donde tus empleados han iniciado o finalizado su jornada.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                <CheckCircle weight="fill" /> Instrucciones de uso
              </h3>
              <ul className="space-y-4 text-zinc-200 text-base">
                <li><strong className="text-white">Habilita los permisos:</strong> Para que esta función sea efectiva, asegúrate de pedir a tus empleados que acepten el consentimiento de Geolocalización en su "Perfil".</li>
                <li><strong className="text-white">Revisa las rutas:</strong> Utiliza el mapa para verificar si los fichajes de los empleados en movilidad (como comerciales o técnicos) coinciden con sus rutas asignadas.</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'equipo',
        title: 'Equipo',
        icon: UsersThree,
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Gestión del Equipo</h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              Aquí controlarás el directorio completo de tu empresa. Es el lugar para dar de alta a nuevos trabajadores o modificar las condiciones de los actuales.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                <CheckCircle weight="fill" /> Pasos a seguir
              </h3>
              <ul className="space-y-4 text-zinc-200 text-base">
                <li><strong className="text-white">Dar de alta:</strong> Haz clic en el botón "Nuevo Empleado". Rellena sus datos personales, asígnale un "Centro de Trabajo" (Sede) y un rol (Empleado o Administrador). Guardar y ¡listo!, el usuario ya puede acceder.</li>
                <li><strong className="text-white">Editar Expediente:</strong> Selecciona cualquier empleado de la lista para ver su expediente. Desde ahí podrás ajustar su salario, cambiar su horario base o subir documentos específicos a su nombre.</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'registros',
        title: 'Registros (Timesheet)',
        icon: ClipboardText,
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Registros y Fichajes</h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              Esta es la tabla fundamental donde se almacena cada movimiento de tiempo de la empresa. Es vital mantenerla limpia y precisa.
            </p>
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                <CheckCircle weight="fill" /> Cómo gestionar incidencias
              </h3>
              <ul className="space-y-4 text-zinc-200 text-base">
                <li><strong className="text-white">Corrección de olvidos:</strong> Si un empleado olvida fichar la salida, aparecerá en estado "Activo" más de la cuenta. Pídele que envíe una "Solicitud de Corrección".</li>
                <li><strong className="text-white">Aprobar correcciones:</strong> Como administrador, verás una alerta cuando haya correcciones pendientes. Haz clic en la solicitud y apruébala; el sistema recalculará automáticamente las horas trabajadas de ese día.</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'sedes',
        title: 'Sedes y Centros',
        icon: Buildings,
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Sedes de Trabajo</h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              Define los lugares físicos donde operan tus empleados. Esto es necesario para habilitar controles geográficos y estructurar la empresa.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                <CheckCircle weight="fill" /> Configuración obligatoria
              </h3>
              <ul className="space-y-4 text-zinc-200 text-base">
                <li><strong className="text-white">Crear una sede:</strong> Ve a "Sedes", añade el nombre (ej. "Oficina Madrid") e indica sus coordenadas (Latitud/Longitud).</li>
                <li><strong className="text-white">Radio de acción (Geofencing):</strong> Establece el radio en metros (ej. 100m). Si un empleado tiene habilitado el "Auto-Clock" en su móvil, la aplicación fichará su entrada y salida automáticamente al entrar o salir de ese círculo.</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'horarios',
        title: 'Horarios y Turnos',
        icon: ClockCountdown,
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Gestión de Horarios</h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              Para calcular horas extra o defectos de jornada, el sistema necesita saber a qué hora *deberían* trabajar los empleados.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                <CheckCircle weight="fill" /> ¿Qué hacer?
              </h3>
              <ul className="space-y-4 text-zinc-200 text-base">
                <li><strong className="text-white">Paso 1 - Plantillas:</strong> Crea tus plantillas base. Por ejemplo: "Mañanas (08:00 a 15:00)" o "Jornada Partida".</li>
                <li><strong className="text-white">Paso 2 - Asignación:</strong> Ve al Calendario de la pestaña Horarios. Selecciona los días y asigna una plantilla a los empleados. Esto marcará su jornada teórica esperada.</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'ausencias',
        title: 'Ausencias',
        icon: CalendarX,
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Ausencias y Vacaciones</h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              Módulo para gestionar el tiempo de inactividad programada de la plantilla.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                <CheckCircle weight="fill" /> Flujo de aprobación
              </h3>
              <ul className="space-y-4 text-zinc-200 text-base">
                <li><strong className="text-white">El Empleado:</strong> Entra a Ausencias, selecciona "Solicitar Ausencia", elige el tipo (Vacaciones, Baja médica) y marca el rango de fechas.</li>
                <li><strong className="text-white">El Administrador:</strong> Verá la solicitud en estado "Pendiente". Al hacer clic, podrá "Aprobar" o "Denegar". Los días aprobados ya no computarán como ausencia injustificada.</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'documentos',
        title: 'Documentos',
        icon: FileDoc,
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Gestor Documental</h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              Tu archivador en la nube seguro para centralizar contratos, normativas de PRL o guías internas.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
              <ul className="space-y-4 text-zinc-200 text-base">
                <li><strong className="text-white">Subir un archivo:</strong> Selecciona el archivo PDF de tu dispositivo. Puedes marcarlo como visible para "Toda la empresa" o asignarlo privadamente a un solo empleado.</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  },
  {
    category: 'Análisis y Reportes',
    items: [
      {
        id: 'analisis',
        title: 'Análisis Gráfico',
        icon: ChartLineUp,
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Análisis Avanzado</h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              El panel de Business Intelligence laboral.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
              <ul className="space-y-4 text-zinc-200 text-base">
                <li><strong className="text-white">Interpretación:</strong> Revisa el balance entre las Horas Teóricas (las que indica el horario) y las Horas Reales (fichadas). Un gran desbalance indica exceso de horas extra o absentismo crónico que debes investigar.</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'informes',
        title: 'Informes Oficiales',
        icon: ClipboardText,
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Generación de Informes</h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              La funcionalidad más importante frente a una Inspección de Trabajo.
            </p>
            <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-rose-400 mb-4 flex items-center gap-2">
                <CheckCircle weight="fill" /> Obligación Legal
              </h3>
              <ul className="space-y-4 text-zinc-200 text-base">
                <li><strong className="text-white">Exportación Mensual:</strong> A final de mes, ve a esta sección, selecciona el mes vencido y haz clic en "Exportar a PDF". Descargarás un documento sellado con todas las jornadas. Guárdalo o imprímelo para cumplir con la ley.</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'nominas',
        title: 'Nóminas',
        icon: CurrencyCircleDollar,
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Gestión de Nóminas</h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              Evita enviar las nóminas por email (inseguro). Usa este buzón privado.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
              <ul className="space-y-4 text-zinc-200 text-base">
                <li><strong className="text-white">Administrador:</strong> A final de mes, sube el PDF de la nómina y asegúrate de elegir en el desplegable al "Empleado" destinatario. Solo él podrá verlo.</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'mensajes',
        title: 'Mensajes',
        icon: ChatTeardrop,
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Comunicación Interna</h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              Envía avisos directos al panel de los trabajadores.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
              <ul className="space-y-4 text-zinc-200 text-base">
                <li><strong className="text-white">Uso:</strong> Escribe un comunicado importante (ej. "Mañana cerramos a las 15:00"). La próxima vez que el trabajador abra Tempos HR, verá el mensaje destacado en su bandeja de entrada.</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  },
  {
    category: 'Configuración de Empresa',
    items: [
      {
        id: 'empresa',
        title: 'Mi Empresa',
        icon: GearSix,
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Datos de Mi Empresa</h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              La identidad de tu organización dentro de Tempos.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                <CheckCircle weight="fill" /> Mantenimiento
              </h3>
              <ul className="space-y-4 text-zinc-200 text-base">
                <li><strong className="text-white">Datos Oficiales:</strong> Asegúrate de que el NIF/CIF y la Razón Social están correctamente escritos, ya que estos datos se imprimirán en las cabeceras de los Informes Oficiales ante inspecciones.</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'legal',
        title: 'Legal y Auditoría',
        icon: ShieldCheck,
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Cumplimiento Legal</h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              Tempos HR es una herramienta de grado forense. Todo queda registrado para garantizar la máxima seguridad jurídica.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                <Info weight="bold" /> ¿Qué supervisar aquí?
              </h3>
              <ul className="space-y-4 text-zinc-200 text-base">
                <li><strong className="text-white">Audit Trail (Trazabilidad):</strong> Esta herramienta te muestra un listado técnico inalterable de qué usuario borró, modificó o creó un registro. Consúltalo si detectas anomalías en los fichajes.</li>
                <li><strong className="text-white">Consentimientos:</strong> Vigila que toda la plantilla haya firmado la política de RGPD.</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'perfil',
        title: 'Mi Perfil',
        icon: UserCircleGear,
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Ajustes Personales</h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              La configuración privada de tu propia cuenta (ya seas Admin o Empleado).
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
              <ul className="space-y-4 text-zinc-200 text-base">
                <li><strong className="text-white">Seguridad:</strong> Usa este apartado para actualizar tu contraseña periódicamente.</li>
                <li><strong className="text-white">Privacidad:</strong> Si habías otorgado permisos de geolocalización pero deseas revocarlos, puedes hacerlo directamente desde aquí.</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  }
];

export default function ManualPage() {
  const navigate = useNavigate();
  const [activeSectionId, setActiveSectionId] = useState('inicio');

  // Encontrar la sección activa para renderizarla
  const activeContent = MANUAL_SECTIONS.flatMap(c => c.items).find(i => i.id === activeSectionId)?.content;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col font-sans">
      {/* Navbar Superior */}
      <header className="h-[80px] border-b border-white/[0.05] bg-[#0d0d0f]/90 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all font-semibold text-sm text-zinc-300 hover:text-white"
          >
            <ArrowLeft weight="bold" />
            Volver a la Intranet
          </button>
          <div className="h-6 w-px bg-white/10 hidden sm:block" />
          <Logo className="hidden sm:flex" />
        </div>
        <h1 className="text-xl font-black uppercase tracking-widest text-zinc-400">Manual de Instrucciones</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar del Índice */}
        <aside className="w-[320px] bg-[#0d0d0f] border-r border-white/[0.05] overflow-y-auto hidden lg:block p-6">
          {MANUAL_SECTIONS.map((category, idx) => (
            <div key={idx} className="mb-10">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 px-2">
                {category.category}
              </h4>
              <nav className="space-y-1">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSectionId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSectionId(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all ${
                        isActive 
                          ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-inner' 
                          : 'text-zinc-400 hover:bg-white/[0.02] hover:text-zinc-200 border border-transparent'
                      }`}
                    >
                      <Icon size={20} weight={isActive ? "fill" : "regular"} />
                      <span className="font-bold text-[15px]">{item.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </aside>

        {/* Contenido Principal */}
        <main className="flex-1 bg-[#0a0a0c] overflow-y-auto p-8 lg:p-16 relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/[0.03] blur-[150px] pointer-events-none rounded-full" />
          
          <div className="max-w-4xl mx-auto relative z-10">
            <motion.div
              key={activeSectionId}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {activeContent}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
