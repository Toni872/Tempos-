import React, { useState } from 'react';
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
  getWebAuthnRegistrationOptions, 
  verifyWebAuthnRegistration, 
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
        actionLabel="GUARDAR CAMBIOS"
        actionIcon={FloppyDisk}
        onAction={() => {}}
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
              <div className="flex flex-col items-center -mt-16">
                <div className="relative">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-8px] border border-blue-500/20 rounded-full border-dashed"
                  />
                  <div className="w-32 h-32 rounded-full bg-[#0a0a0c] border-[6px] border-[#0d0d0f] shadow-2xl flex items-center justify-center overflow-hidden relative z-10 group/avatar">
                    <div className="w-full h-full bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex items-center justify-center text-blue-500 text-5xl font-black italic tracking-tighter">
                       {profile?.displayName?.charAt(0) || profile?.email?.charAt(0)}
                    </div>
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all duration-500 cursor-pointer backdrop-blur-md">
                       <Cpu size={24} className="text-white/40 mb-2" />
                       <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Cargar DNA</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-[#0d0d0f] flex items-center justify-center shadow-lg z-20">
                     <ShieldCheck size={16} weight="fill" className="text-white" />
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
              onAction={() => {}}
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
                      <InputGroup label="Nombre Operativo" placeholder="Ej. Antonio García" value={profile?.displayName} />
                      <InputGroup label="Identificación Legal (DNI)" placeholder="12345678X" value={profile?.dni} />
                      <InputGroup label="Canal de Comunicaciones" placeholder="email@empresa.com" value={profile?.email} disabled />
                      <InputGroup label="Frecuencia Móvil" placeholder="+34 600 000 000" value={profile?.phone} />
                      
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

function InputGroup({ label, placeholder, value, disabled }) {
  return (
    <div className="space-y-3 group/input">
      <label className="text-[10px] font-black text-white/20 group-focus-within/input:text-blue-500 transition-colors uppercase tracking-[0.3em] ml-2 italic">{label}</label>
      <div className="relative">
        <input 
          type="text" 
          defaultValue={value}
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
