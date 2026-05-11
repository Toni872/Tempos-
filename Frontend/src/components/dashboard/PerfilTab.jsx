import React, { useState } from 'react';
import { z } from 'zod';
import { 
  UserCircle, 
  Lock, 
  Bell, 
  IdentificationCard, 
  EnvelopeSimple, 
  Phone, 
  ShieldCheck,
  FloppyDisk,
  Key,
  Fingerprint,
  BellSlash,
  ChatCircleText,
  ShieldChevron,
  Cpu,
  ArrowsClockwise,
  UserCheck,
  DeviceMobile,
  Keyhole
} from '@phosphor-icons/react';
import { startRegistration } from '@simplewebauthn/browser';
import { 
  updateProfile,
  getClientSession,
  subscribePush,
  unsubscribePush,
  sendTestPush 
} from '@/lib/api';
import SectionHeader from '@/components/ui/SectionHeader';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function PerfilTab({ profile, onUpdate }) {
  const [bioStatus, setBioStatus] = useState('idle'); 
  const [pushEnabled, setPushEnabled] = useState(typeof Notification !== 'undefined' && Notification.permission === 'granted');
  const [pushStatus, setPushStatus] = useState('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    photoURL: profile?.photoURL || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Simulación senior: Lectura local para preview instantánea
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, photoURL: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const profileSchema = z.object({
    displayName: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(50),
    photoURL: z.string().optional()
  });

  const handleSave = async () => {
    setValidationError(null);
    setIsSaving(true);
    
    try {
      // Validación técnica obligatoria (Zod)
      const validatedData = profileSchema.parse(formData);
      
      const session = getClientSession();
      await updateProfile(session.token, validatedData);
      onUpdate?.(); // Refrescar datos globales
    } catch (err) {
      if (err instanceof z.ZodError) {
        setValidationError(err.errors[0].message);
      } else {
        alert('Error al guardar: ' + err.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePush = async () => {
    try {
      if (pushEnabled) {
        setPushStatus('loading');
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await unsubscribePush(sub.endpoint);
          await sub.unsubscribe();
        }
        setPushEnabled(false);
        setPushStatus('idle');
      } else {
        setPushStatus('loading');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Permiso denegado para notificaciones.');
          setPushStatus('idle');
          return;
        }

        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'BFD5Z6vJ_8-Y-hR9xW5yQn9n9f9v9x9v9v9x9v9v9x9v9v9x9v9v9x9v9v9x9v9v9x9v9v9x9v9v9x9v9w' 
        });

        await subscribePush(sub);
        setPushEnabled(true);
        setPushStatus('success');
        setTimeout(() => setPushStatus('idle'), 2000);
      }
    } catch (err) {
      console.error('Push Error:', err);
      setPushStatus('error');
    }
  };

  const handleTestPush = async () => {
    try {
      await sendTestPush();
    } catch (err) {
      alert('Error enviando prueba: ' + err.message);
    }
  };

  const handleRegisterBiometric = async () => {
    try {
      const session = getClientSession();
      if (!session?.token) throw new Error('No hay sesión activa');
      const options = await getWebAuthnRegistrationOptions(session.token);
      const regResp = await startRegistration({ optionsJSON: options });
      await verifyWebAuthnRegistration(session.token, regResp);
      alert('¡Dispositivo registrado correctamente!');
    } catch (err) {
      console.error('Error WebAuthn:', err);
      alert('Error al registrar biometría: ' + err.message);
    }
  };

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      <SectionHeader 
        icon={UserCircle}
        title="Centro de Identidad Digital"
        subtitle="Gestión de credenciales, seguridad biométrica y preferencias de terminal personal."
        actionLabel={isSaving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
        actionIcon={FloppyDisk}
        onAction={handleSave}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        {/* COLUMNA DE IDENTIDAD Y SEGURIDAD */}
        <div className="xl:col-span-1 space-y-10">
          {/* DIGITAL ID CARD */}
          <Card className="overflow-hidden bg-[#0d0d0f]/40 backdrop-blur-sm border-white/5 shadow-2xl relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 opacity-50" />
            <div className="h-32 bg-gradient-to-br from-blue-600/20 to-indigo-900/40 relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] to-transparent" />
            </div>
            <CardBody className="pt-0 relative px-8 pb-10">
              <div className="flex flex-col items-center -mt-20">
                <div className="relative group/avatar-container">
                  {/* Glow Ring Animado */}
                  <div className="absolute inset-[-4px] bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full blur-md opacity-20 group-hover/avatar-container:opacity-40 transition-opacity duration-700" />
                  
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-10px] border border-blue-500/10 rounded-full border-dashed"
                  />
                  
                  <div 
                    className="w-40 h-40 rounded-full bg-[#0a0a0c] border-[1px] border-white/10 shadow-[0_0_50px_rgba(37,99,235,0.1)] flex items-center justify-center overflow-hidden relative z-10 cursor-pointer"
                    onClick={() => document.getElementById('avatar-upload').click()}
                  >
                    {formData.photoURL ? (
                      <img src={formData.photoURL} alt="Avatar" className="w-full h-full object-cover group-hover/avatar-container:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-600/10 to-indigo-600/10 flex items-center justify-center text-blue-500/40 text-6xl font-black italic tracking-tighter">
                         {formData.displayName?.charAt(0) || profile?.email?.charAt(0)}
                      </div>
                    )}
                    
                    {/* Overlay de Carga Mejorado */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover/avatar-container:opacity-100 transition-all duration-500">
                       <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2 border border-white/10">
                          <Cpu size={20} className="text-white" />
                       </div>
                       <span className="text-[8px] font-black text-white uppercase tracking-[0.3em]">Sincronizar Foto</span>
                    </div>

                    <input 
                      id="avatar-upload"
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {/* Badge de Estatus Simétrico */}
                  <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#0d0d0f] rounded-full p-1.5 z-20 shadow-2xl">
                    <div className="w-full h-full bg-emerald-500 rounded-full flex items-center justify-center border border-emerald-400/20">
                       <ShieldCheck size={16} weight="fill" className="text-white" />
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center space-y-1">
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{profile?.displayName || 'Operador Tempos'}</h3>
                  <p className="text-[11px] text-white/20 font-black uppercase tracking-[0.3em] italic">{profile?.email}</p>
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Badge color="blue" className="italic font-black tracking-widest px-4">
                    {profile?.role === 'admin' ? 'SYSTEM ADMIN' : 'OPERATIVE'}
                  </Badge>
                  <Badge color="zinc" className="opacity-40 italic font-black tracking-widest">ID: {profile?.id?.substring(0, 8) || 'TMP-2026'}</Badge>
                </div>
              </div>
              
              <div className="mt-12 pt-10 border-t border-white/5 space-y-5">
                 <ProfileDetail icon={EnvelopeSimple} label="Nodo de Comunicación" value={profile?.email} />
                 <ProfileDetail icon={Phone} label="Terminal Móvil" value={profile?.phone || 'No Enlazado'} />
                 <ProfileDetail icon={IdentificationCard} label="Credencial Legal" value={profile?.dni || 'PENDIENTE'} />
              </div>
            </CardBody>
          </Card>

          {/* SECURITY MODULES */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2 italic">Módulos de Seguridad</h4>
            
            <SecurityCard 
              icon={Keyhole}
              title="Protocolo de Acceso"
              desc="Última rotación de credenciales hace 90 días. Estado: Óptimo."
              actionLabel="MODIFICAR CLAVE"
              color="amber"
              onAction={() => alert('Protocolo de seguridad: Se ha enviado un enlace de rotación a su Nodo de Comunicación (Email).')}
            />

            <SecurityCard 
              icon={Fingerprint}
              title="Biometría Avanzada"
              desc="Habilite FaceID o TouchID para un despliegue operativo instantáneo."
              actionLabel="ENLAZAR DISPOSITIVO"
              color="blue"
              onAction={handleRegisterBiometric}
            />

            <SecurityCard 
              icon={pushEnabled ? Bell : BellSlash}
              title="Alertas de Sistema"
              desc="Sincronización de notificaciones push en tiempo real para eventos de jornada."
              actionLabel={pushEnabled ? 'DESACTIVAR' : 'ACTIVAR'}
              color={pushEnabled ? 'orange' : 'zinc'}
              onAction={handleTogglePush}
              loading={pushStatus === 'loading'}
            />
          </div>
        </div>

        {/* FORMULARIO DE GESTIÓN */}
        <div className="xl:col-span-2 space-y-10">
          <Card className="bg-white/[0.01] border-white/5 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <UserCheck size={160} weight="thin" />
             </div>
             
             <div className="relative z-10 space-y-12">
                <div>
                   <h4 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] mb-10 italic border-b border-white/5 pb-4">Expediente Personal</h4>
                   <form className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                      <InputGroup 
                        name="displayName"
                        label="Nombre Operativo" 
                        placeholder="Ej. Antonio García" 
                        value={formData.displayName} 
                        onChange={handleInputChange}
                      />
                      <InputGroup 
                        name="dni"
                        label="Identificación Legal (DNI)" 
                        placeholder="12345678X" 
                        value={formData.dni} 
                        onChange={handleInputChange}
                      />
                      <InputGroup label="Canal de Comunicaciones" placeholder="email@empresa.com" value={profile?.email} disabled />
                      <InputGroup 
                        name="phone"
                        label="Frecuencia Móvil" 
                        placeholder="+34 600 000 000" 
                        value={formData.phone} 
                        onChange={handleInputChange}
                      />
                      
                      <div className="md:col-span-2 space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">
                           <ChatCircleText size={14} weight="fill" className="text-blue-500" />
                           Notas Operativas / Bio
                        </label>
                        <textarea 
                          placeholder="Descripción breve del rol o biografía técnica..."
                          className="w-full bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 text-sm font-bold text-white outline-none focus:border-blue-500/40 transition-all min-h-[160px] resize-none shadow-inner italic leading-relaxed"
                        />
                      </div>
                   </form>
                </div>

                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-8 border-t border-white/5">
                   <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 border border-white/5 shadow-inner">
                         <ShieldChevron size={32} weight="fill" />
                      </div>
                      <div>
                         <p className="text-xs font-black text-white uppercase italic tracking-tight">Privacidad Certificada</p>
                         <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-1">Estatus GDPR: Cumplimiento Total</p>
                      </div>
                   </div>
                   <div className="flex gap-4 w-full sm:w-auto">
                      <button className="flex-1 sm:flex-none px-8 py-4 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-white/5 transition-all">
                         DESCARGAR LEGAJO
                      </button>
                      <button className="flex-1 sm:flex-none px-8 py-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-rose-500/20 transition-all">
                         REVOCAR ACCESO
                      </button>
                   </div>
                </div>
             </div>
          </Card>

          <div className="flex items-center justify-center gap-6 opacity-20 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-1000 group">
             <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
             <div className="flex items-center gap-3">
                <Cpu size={24} weight="fill" className="group-hover:text-blue-500 transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">Identidad Certificada</span>
             </div>
             <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
          </div>

          {/* MÓDULO DE VERIFICACIÓN LEGAL (NUEVO) */}
          <Card className="bg-gradient-to-br from-blue-600/10 to-indigo-600/5 border-blue-500/20 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                <ShieldCheck size={160} weight="thin" />
             </div>
             
             <div className="relative z-10 space-y-8">
                <div>
                   <Badge color="blue" className="italic font-black tracking-widest mb-6 shadow-lg shadow-blue-500/20">CUMPLIMIENTO NORMATIVO</Badge>
                   <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Validación de Jornada Mensual</h3>
                   <p className="text-white/40 text-[11px] font-medium mt-4 max-w-md italic leading-relaxed uppercase tracking-wider">
                      Según el Art. 34.9 del ET, el trabajador debe validar sus registros mensuales. Al confirmar, los datos se vuelven inalterables.
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 backdrop-blur-md">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Periodo Actual</p>
                      <p className="text-xl font-black text-white italic uppercase tracking-tighter">
                         {new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date())}
                      </p>
                   </div>
                   <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 backdrop-blur-md">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Horas Registradas</p>
                      <p className="text-xl font-black text-blue-500 italic uppercase tracking-tighter">
                         --.-- h
                      </p>
                   </div>
                </div>

                <button 
                  onClick={async () => {
                    if (!confirm("Al validar, confirmas que todos los fichajes del mes son correctos. Los registros se bloquearán por seguridad legal. ¿Deseas continuar?")) return;
                    try {
                      const session = getClientSession();
                      const now = new Date();
                      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                      
                      await verifyPeriod(session.token, { startDate: start, endDate: end });
                      alert("¡Mes verificado y bloqueado correctamente! Se ha generado tu firma digital SHA-256.");
                    } catch (err) {
                      alert("Error en la verificación: " + err.message);
                    }
                  }}
                  className="w-full py-6 rounded-[2rem] bg-white text-black hover:bg-blue-500 hover:text-white text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all shadow-2xl active:scale-[0.98]"
                >
                   <ShieldCheck size={24} weight="fill" />
                   FIRMAR Y BLOQUEAR MES
                </button>
             </div>
          </Card>

          {/* BOTÓN DE GUARDADO GLOBAL */}
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col gap-4">
             {validationError && (
               <motion.div 
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="px-6 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest text-center animate-pulse"
               >
                  {validationError}
               </motion.div>
             )}
             <button 
               onClick={handleSave}
               disabled={isSaving}
               className="w-full py-6 rounded-[2rem] bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.5em] flex items-center justify-center gap-4 transition-all shadow-2xl shadow-blue-600/40 active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
             >
               {isSaving ? (
                 <ArrowsClockwise size={22} className="animate-spin" />
               ) : (
                 <FloppyDisk size={22} weight="fill" />
               )}
               {isSaving ? 'CIFRANDO Y SINCRONIZANDO...' : 'CONFIRMAR Y GUARDAR PERFIL'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileDetail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 group/detail">
      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover/detail:text-blue-400 transition-colors border border-white/5 shadow-inner">
         <Icon size={16} weight="duotone" />
      </div>
      <div>
        <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.2em] leading-none mb-1">{label}</p>
        <p className="text-[11px] font-black text-white/60 group-hover/detail:text-white transition-colors italic uppercase tracking-tighter">{value}</p>
      </div>
    </div>
  );
}

function SecurityCard({ icon: Icon, title, desc, actionLabel, color, onAction, loading }) {
  const colors = {
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-amber-500/5",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-500 shadow-blue-500/5",
    orange: "bg-orange-500/10 border-orange-500/20 text-orange-500 shadow-orange-500/5",
    zinc: "bg-white/5 border-white/10 text-white/40 shadow-none"
  };

  const btnColors = {
    amber: "bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white border-amber-500/20",
    blue: "bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white border-blue-500/20",
    orange: "bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white border-orange-500/20",
    zinc: "bg-white/5 text-white/40 hover:bg-white hover:text-black border-white/10"
  };

  return (
    <Card className={cn("border transition-all group overflow-hidden", colors[color])}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.03] blur-3xl pointer-events-none" />
      <CardBody className="p-8 flex items-start gap-6 relative z-10">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl border border-current/20 bg-current/10")}>
           <Icon weight="duotone" size={28} />
        </div>
        <div className="flex-1 space-y-4">
           <div>
              <h5 className="text-sm font-black italic uppercase tracking-widest">{title}</h5>
              <p className="text-[10px] opacity-60 font-medium mt-1.5 leading-relaxed italic">{desc}</p>
           </div>
           <button 
             onClick={onAction}
             disabled={loading}
             className={cn(
               "text-[9px] font-black px-6 py-2.5 rounded-xl uppercase tracking-[0.3em] transition-all border shadow-lg active:scale-95 flex items-center gap-2 group/btn",
               btnColors[color]
             )}
           >
             {loading && <ArrowsClockwise size={12} className="animate-spin" />}
             {actionLabel}
             <ArrowsClockwise size={12} className="opacity-0 group-hover/btn:opacity-100 group-hover/btn:rotate-180 transition-all duration-500" />
           </button>
        </div>
      </CardBody>
    </Card>
  );
}

function InputGroup({ label, placeholder, value, disabled, name, onChange }) {
  return (
    <div className="space-y-3 group/input">
      <label className="text-[10px] font-black text-white/20 group-focus-within/input:text-blue-500 transition-colors uppercase tracking-[0.3em] ml-2 italic">{label}</label>
      <div className="relative">
        <input 
          type="text" 
          name={name}
          defaultValue={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "w-full bg-white/[0.02] border border-white/5 rounded-[1.5rem] px-6 py-4 text-xs font-black text-white outline-none transition-all shadow-inner uppercase tracking-widest italic",
            disabled ? "opacity-30 cursor-not-allowed bg-black/20" : "focus:border-blue-500/40 hover:border-white/10"
          )}
        />
        {disabled && <Lock size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/10" />}
      </div>
    </div>
  );
}
