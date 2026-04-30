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
  ChatCircleText
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
      alert('¡Notificación de prueba enviada!');
    } catch (err) {
      alert('Error enviando prueba: ' + err.message);
    }
  };

  const handleRegisterBiometric = async () => {
    try {
      const session = getClientSession();
      if (!session?.token) throw new Error('No hay sesión activa');

      // 1. Obtener opciones del servidor
      const options = await getWebAuthnRegistrationOptions(session.token);

      // 2. Ejecutar ceremonia de registro en el navegador
      const regResp = await startRegistration({ optionsJSON: options });

      // 3. Verificar respuesta en el servidor
      await verifyWebAuthnRegistration(session.token, regResp);

      alert('¡Dispositivo registrado correctamente!');
    } catch (err) {
      console.error('Error WebAuthn:', err);
      alert('Error al registrar biometría: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeader 
        icon={UserCircle}
        title="Mi Perfil"
        subtitle="Gestiona tu información personal, seguridad y preferencias de acceso."
        actionLabel="Actualizar Perfil"
        actionIcon={FloppyDisk}
        onAction={() => {}}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Identity Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
               <div className="absolute inset-0 bg-black/20" />
            </div>
            <CardBody className="pt-0 relative">
              <div className="flex flex-col items-center -mt-16">
                <div className="w-32 h-32 rounded-full bg-[#111114] border-[8px] border-[#111114] shadow-2xl flex items-center justify-center overflow-hidden relative group">
                  <div className="w-full h-full bg-blue-600/10 flex items-center justify-center text-blue-500 text-5xl font-black">
                     {profile?.displayName?.charAt(0) || profile?.email?.charAt(0)}
                  </div>
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                     <span className="text-xs font-bold text-white uppercase tracking-widest">Cambiar Foto</span>
                  </div>
                </div>
                <div className="mt-5 text-center">
                  <h3 className="text-xl font-black text-white">{profile?.displayName || 'Usuario Tempos'}</h3>
                  <p className="text-sm text-zinc-500 font-semibold">{profile?.email}</p>
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Badge color="blue" dot>
                    <ShieldCheck weight="fill" className="w-3.5 h-3.5" />
                    {profile?.role === 'admin' ? 'Administrador' : 'Empleado'}
                  </Badge>
                  <Badge color="zinc">V2.4 PRO</Badge>
                </div>
              </div>
              
              <div className="mt-10 pt-8 border-t border-white/[0.04] space-y-4">
                 <ProfileDetail icon={EnvelopeSimple} label="Email corporativo" value={profile?.email} />
                 <ProfileDetail icon={Phone} label="Teléfono" value={profile?.phone || 'No configurado'} />
                 <ProfileDetail icon={IdentificationCard} label="DNI / NIE" value={profile?.dni || 'Pendiente'} />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-amber-500/5 border-amber-500/20 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[40px] group-hover:bg-amber-500/20 transition-all" />
             <CardBody className="p-6 flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                   <Key weight="duotone" className="w-6 h-6" />
                </div>
                <div>
                   <h5 className="text-sm font-black text-amber-500 uppercase tracking-widest">Seguridad de la Cuenta</h5>
                   <p className="text-xs text-amber-500/60 font-medium mt-1.5 leading-relaxed">Último cambio de contraseña hace 3 meses. Recomendamos actualizarla periódicamente para mantener el grado de encriptación fuerte.</p>
                   <button className="mt-4 text-[10px] font-black text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-lg uppercase tracking-[0.2em] transition-colors">
                      Modificar Credenciales →
                   </button>
                </div>
             </CardBody>
          </Card>

          <Card className="bg-blue-500/5 border-blue-500/20 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[40px] group-hover:bg-blue-500/20 transition-all" />
             <CardBody className="p-6 flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                   <Fingerprint weight="duotone" className="w-6 h-6" />
                </div>
                <div>
                   <h5 className="text-sm font-black text-blue-500 uppercase tracking-widest">Autenticación Biométrica</h5>
                   <p className="text-xs text-blue-500/60 font-medium mt-1.5 leading-relaxed">
                     Registra tu huella dactilar o FaceID para fichar sin contraseñas de forma segura.
                   </p>
                   <button 
                     onClick={handleRegisterBiometric}
                     className="mt-4 text-[10px] font-black text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 rounded-lg uppercase tracking-[0.2em] transition-colors"
                   >
                     Registrar Dispositivo →
                   </button>
                </div>
             </CardBody>
          </Card>

          <Card className="bg-orange-500/5 border-orange-500/20 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[40px] group-hover:bg-orange-500/20 transition-all" />
             <CardBody className="p-6 flex items-start gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.2)] ${pushEnabled ? 'bg-orange-500/10 text-orange-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                   {pushEnabled ? <Bell weight="duotone" className="w-6 h-6" /> : <BellSlash weight="duotone" className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                   <h5 className="text-sm font-black text-orange-500 uppercase tracking-widest">Alertas de Jornada</h5>
                   <p className="text-xs text-orange-500/60 font-medium mt-1.5 leading-relaxed">Recibe recordatorios de fichaje y avisos del sistema en tiempo real.</p>
                   <div className="flex flex-col gap-2 mt-4">
                     <button 
                       onClick={handleTogglePush}
                       disabled={pushStatus === 'loading'}
                       className={`text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-[0.2em] transition-all border ${
                         pushEnabled 
                         ? 'border-orange-500/20 text-orange-400 bg-orange-500/5 hover:bg-orange-500/10' 
                         : 'border-zinc-500/20 text-zinc-500 bg-zinc-500/5 hover:bg-zinc-500/10'
                       }`}
                     >
                       {pushStatus === 'loading' ? 'Procesando...' : pushEnabled ? 'Desactivar Notificaciones' : 'Activar Notificaciones'}
                     </button>
                     {pushEnabled && (
                       <button 
                         onClick={handleTestPush}
                         className="text-[9px] font-bold text-zinc-500 hover:text-orange-400 transition-colors flex items-center gap-1.5"
                       >
                         <ChatCircleText size={14} /> Probar envío
                       </button>
                     )}
                   </div>
                </div>
             </CardBody>
          </Card>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardBody className="p-8">
               <h4 className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-8">Información Personal</h4>
               <form className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <InputGroup label="Nombre Completo" placeholder="Ej. Antonio García" value={profile?.displayName} />
                  <InputGroup label="DNI / NIE" placeholder="12345678X" value={profile?.dni} />
                  <InputGroup label="Correo Electrónico" placeholder="email@empresa.com" value={profile?.email} disabled />
                  <InputGroup label="Teléfono" placeholder="+34 600 000 000" value={profile?.phone} />
                  
                  <div className="md:col-span-2 space-y-2 mt-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Bio / Notas</label>
                    <textarea 
                      placeholder="Una breve descripción sobre ti..."
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-sm font-semibold text-zinc-300 outline-none focus:border-blue-500/40 transition-all min-h-[120px] resize-none"
                    />
                  </div>
               </form>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-8">
               <h4 className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-8">Preferencias de Sesión</h4>
               <div className="space-y-4">
                  <div 
                    onClick={handleTogglePush}
                    className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl cursor-pointer hover:bg-white/[0.04] transition-all group"
                  >
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${pushEnabled ? 'bg-orange-500/10 text-orange-500' : 'bg-zinc-800 text-zinc-600'}`}>
                           {pushEnabled ? <Bell weight="duotone" className="w-5 h-5" /> : <BellSlash weight="duotone" className="w-5 h-5" />}
                        </div>
                        <div>
                           <p className="text-sm font-bold text-white">Notificaciones Push</p>
                           <p className="text-xs text-zinc-600 font-medium">Estado: {pushEnabled ? 'Activadas' : 'Desactivadas'}</p>
                        </div>
                     </div>
                     <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-all ${pushEnabled ? 'bg-orange-600' : 'bg-zinc-800 shadow-inner'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-all ${pushEnabled ? 'ml-auto shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'ml-0'}`} />
                     </div>
                  </div>
               </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProfileDetail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3.5 group">
      <Icon className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-colors" weight="duotone" />
      <div>
        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest leading-none">{label}</p>
        <p className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">{value}</p>
      </div>
    </div>
  );
}

function InputGroup({ label, placeholder, value, disabled }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">{label}</label>
      <input 
        type="text" 
        defaultValue={value}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm font-semibold text-zinc-300 outline-none transition-all",
          disabled ? "opacity-50 cursor-not-allowed" : "focus:border-blue-500/40 hover:border-white/10"
        )}
      />
    </div>
  );
}
