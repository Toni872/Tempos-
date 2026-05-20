import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  RocketLaunch, 
  Buildings, 
  Crown, 
  CreditCard, 
  Receipt,
  ArrowRight,
  CircleNotch,
  Warning,
  Check
} from '@phosphor-icons/react';
import { createCheckoutSession, createPortalSession, getClientSession } from '@/lib/api';

const PLANS = [
  {
    id: 'starter',
    name: 'Plan Starter',
    price: '1.99€',
    period: '/mes',
    desc: 'Para autónomos y micro-pymes que buscan cumplimiento legal sin complicaciones.',
    features: [
      'Hasta 5 usuarios',
      'Registro de jornada legal',
      'Exportación PDF/Excel',
      'App Móvil Básica',
      'Soporte Estándar'
    ],
    icon: RocketLaunch,
    color: 'blue'
  },
  {
    id: 'business',
    name: 'Plan Business',
    price: '3.99€',
    period: '/empleado/mes',
    desc: 'La solución completa para empresas en crecimiento y equipos dinámicos.',
    features: [
      'Usuarios Ilimitados',
      'Sedes y Centros Ilimitados',
      'Gestión de Vacaciones/Bajas',
      'Geovallado (Geofencing)',
      'Soporte Prioritario'
    ],
    icon: Buildings,
    color: 'blue',
    featured: true
  },
  {
    id: 'enterprise',
    name: 'Plan Enterprise',
    price: '5.99€',
    period: '/empleado/mes',
    desc: 'Análisis predictivo con IA y control avanzado para grandes corporaciones.',
    features: [
      'Todo lo del Plan Business',
      'Análisis Predictivo IA',
      'API para Nóminas',
      'Gerente de Cuenta Dedicado',
      'SLA Garantizado'
    ],
    icon: Crown,
    color: 'indigo'
  }
];

export default function PlanesTab({ profile }) {
  const currentPlanId = profile?.subscriptionPlan || 'trial';
  const isPlanActive = profile?.subscriptionStatus === 'active' || profile?.subscriptionStatus === 'trialing' || profile?.isTrial;

  const [loadingPlanId, setLoadingPlanId] = useState(null); // plan.id | 'portal' | null
  const [errorMsg, setErrorMsg] = useState(null);
  const [stripeStatus, setStripeStatus] = useState(null); // 'success' | 'canceled' | null

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setStripeStatus('success');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('canceled') === 'true') {
      setStripeStatus('canceled');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handlePlanAction = async (planId) => {
    if (planId === 'enterprise') {
      window.location.href = 'mailto:ventas@tempos.es?subject=Interés%20en%20Plan%20Enterprise';
      return;
    }
    
    setErrorMsg(null);
    setLoadingPlanId(planId);
    try {
      const session = getClientSession();
      if (!session?.token) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión de nuevo.');
      }
      
      const hasActiveSub = profile?.subscriptionPlan && profile?.subscriptionPlan !== 'trial' && (profile?.subscriptionStatus === 'active' || profile?.subscriptionStatus === 'trialing');
      
      if (hasActiveSub) {
        // Redirigir al portal para cualquier gestión (upgrade/downgrade/cancelar/métodos de pago)
        const portalRes = await createPortalSession(session.token);
        if (portalRes?.url) {
          window.location.href = portalRes.url;
        } else {
          throw new Error('No se pudo generar la sesión del portal de Stripe.');
        }
      } else {
        // Crear sesión de checkout para el plan seleccionado
        const checkoutRes = await createCheckoutSession(session.token, planId);
        if (checkoutRes?.url) {
          window.location.href = checkoutRes.url;
        } else {
          throw new Error('No se pudo generar la sesión de Stripe Checkout.');
        }
      }
    } catch (err) {
      console.error('Error de Stripe:', err);
      setErrorMsg(err.message || 'Error al conectar con la pasarela de pagos.');
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handlePortalAction = async () => {
    setErrorMsg(null);
    setLoadingPlanId('portal');
    try {
      const session = getClientSession();
      if (!session?.token) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión de nuevo.');
      }
      
      const portalRes = await createPortalSession(session.token);
      if (portalRes?.url) {
        window.location.href = portalRes.url;
      } else {
        throw new Error('No se pudo generar la sesión del portal de Stripe.');
      }
    } catch (err) {
      console.error('Error de portal:', err);
      setErrorMsg(err.message || 'Error al conectar con la pasarela de pagos.');
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handleDevUpgrade = async (planId) => {
    try {
      setLoadingPlanId(`dev-${planId}`);
      const session = getClientSession();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/api/v1/auth/dev-upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({ planId })
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al simular upgrade');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="space-y-10">
      {/* Stripe Status Alerts */}
      <AnimatePresence>
        {stripeStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-6 rounded-[2rem] border backdrop-blur-md flex items-start gap-4 shadow-xl ${
              stripeStatus === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
              stripeStatus === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/30'
                : 'bg-amber-500/20 border-amber-500/30'
            }`}>
              {stripeStatus === 'success' ? (
                <Check size={20} weight="bold" />
              ) : (
                <Warning size={20} weight="bold" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                {stripeStatus === 'success' ? 'Suscripción Procesada con Éxito' : 'Proceso de Pago Cancelado'}
              </h4>
              <p className="text-xs opacity-80 leading-relaxed font-medium">
                {stripeStatus === 'success'
                  ? '¡Felicidades! 🎉 Tu plan ha sido actualizado correctamente en Stripe. Las nuevas características ya están habilitadas en tu cuenta.'
                  : 'Has cancelado el proceso de pago. No se ha realizado ningún cargo y mantienes tu plan actual.'}
              </p>
            </div>
            <button 
              onClick={() => setStripeStatus(null)}
              className="text-xs uppercase tracking-widest font-black opacity-40 hover:opacity-100 transition-opacity"
            >
              Cerrar
            </button>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 text-rose-400 backdrop-blur-md flex items-start gap-4 shadow-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
              <Warning size={20} weight="bold" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Error de Transacción</h4>
              <p className="text-xs opacity-80 leading-relaxed font-medium">{errorMsg}</p>
            </div>
            <button 
              onClick={() => setErrorMsg(null)}
              className="text-xs uppercase tracking-widest font-black opacity-40 hover:opacity-100 transition-opacity"
            >
              Cerrar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Status */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tight">Suscripción y Planes</h2>
          <p className="text-zinc-500 text-sm max-w-md">
            Gestiona tu plan actual, métodos de pago y consulta tus facturas.
          </p>
        </div>
        
        {profile?.isTrial && (
          <div className="px-5 py-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 backdrop-blur-md flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
              <RocketLaunch size={20} weight="duotone" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-500/70">Estado Actual</p>
              <h4 className="text-sm font-bold text-white">Periodo de Prueba (Acceso Total)</h4>
            </div>
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {PLANS.map((plan, i) => {
          const isCurrent = currentPlanId === plan.id;
          
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative group rounded-[32px] p-8 border transition-all duration-500 overflow-hidden ${
                plan.featured 
                  ? 'bg-blue-600/[0.04] border-blue-500/30 shadow-[0_20px_50px_-12px_rgba(59,130,246,0.15)]' 
                  : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.03]'
              } ${isCurrent ? 'ring-2 ring-blue-500/50 border-blue-500/50' : ''}`}
            >
              {plan.featured && (
                <div className="absolute top-0 right-8">
                  <div className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-b-xl shadow-lg shadow-blue-600/20">
                    Recomendado
                  </div>
                </div>
              )}

              <div className="space-y-6 relative z-10">
                {/* Plan Icon */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-transform duration-500 group-hover:scale-110 ${
                  plan.featured ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/5 border-white/10 text-zinc-400'
                }`}>
                  <plan.icon size={28} weight="duotone" />
                </div>

                {/* Price */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    {isCurrent && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[9px] font-black uppercase tracking-wider">
                        Activo
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white tracking-tighter">{plan.price}</span>
                    <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{plan.period}</span>
                  </div>
                </div>

                <p className="text-sm text-zinc-500 leading-relaxed min-h-[48px]">
                  {plan.desc}
                </p>

                {/* Features */}
                <div className="space-y-4 py-2">
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        plan.featured ? 'bg-blue-500/10 text-blue-500' : 'bg-white/5 text-zinc-600'
                      }`}>
                        <CheckCircle weight="fill" size={14} />
                      </div>
                      <span className="text-[13px] text-zinc-400 font-medium">{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handlePlanAction(plan.id)}
                    disabled={loadingPlanId !== null}
                    className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      isCurrent
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/5'
                        : plan.featured 
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20' 
                          : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                    } disabled:opacity-50`}
                  >
                    {loadingPlanId === plan.id ? (
                      <CircleNotch size={14} className="animate-spin" />
                    ) : plan.id === 'enterprise' ? (
                      'Contactar Ventas'
                    ) : isCurrent ? (
                      'Gestionar Plan'
                    ) : (
                      'Actualizar ahora'
                    )}
                    {loadingPlanId !== plan.id && <ArrowRight weight="bold" size={12} />}
                  </button>
                  
                  {/* BOTÓN MODO DESARROLLO */}
                  {!isCurrent && plan.id !== 'enterprise' && (
                    <button
                      onClick={() => handleDevUpgrade(plan.id)}
                      disabled={loadingPlanId !== null}
                      className="w-full py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                    >
                      {loadingPlanId === `dev-${plan.id}` ? <CircleNotch size={12} className="animate-spin mx-auto" /> : 'DEV: Simular Upgrade'}
                    </button>
                  )}
                </div>
              </div>

              {/* Decorative background glow */}
              {plan.featured && (
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Stripe Management Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/[0.06] space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/50 flex items-center justify-center border border-white/5 text-zinc-400">
              <CreditCard size={24} weight="duotone" />
            </div>
            <h3 className="text-xl font-bold text-white">Método de Pago</h3>
          </div>
          
          <div className="p-5 rounded-2xl bg-black/20 border border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-4">
              {profile?.stripeCardBrand ? (
                <div className="w-10 h-6 rounded bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-black uppercase text-blue-400 shrink-0">
                  {profile.stripeCardBrand}
                </div>
              ) : (
                <div className="w-10 h-6 rounded bg-zinc-800 border border-white/10 shrink-0" />
              )}
              <div>
                <p className="text-sm font-bold text-white">
                  {profile?.stripeCardBrand 
                    ? `${profile.stripeCardBrand.toUpperCase()} •••• ${profile.stripeCardLast4 || '****'}` 
                    : 'No hay tarjeta registrada'}
                </p>
                <p className="text-xs text-zinc-600 font-medium">
                  {profile?.stripeCardBrand 
                    ? 'Método de facturación predeterminado en Stripe' 
                    : 'Registra una tarjeta para evitar interrupciones'}
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={handlePortalAction}
            disabled={loadingPlanId !== null}
            className="text-[11px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {loadingPlanId === 'portal' ? (
              <>Conectando con Stripe <CircleNotch size={10} className="animate-spin" /></>
            ) : (
              <>Configurar en Portal de Pagos <ArrowRight weight="bold" size={10} /></>
            )}
          </button>
        </div>

        <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/[0.06] space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/50 flex items-center justify-center border border-white/5 text-zinc-400">
              <Receipt size={24} weight="duotone" />
            </div>
            <h3 className="text-xl font-bold text-white">Últimas Facturas</h3>
          </div>

          <div className="space-y-2">
            {[1, 2].map((_, i) => (
              <div key={i} className="p-4 rounded-2xl bg-black/20 border border-white/[0.02] flex items-center justify-between opacity-30 grayscale">
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <p className="text-xs font-bold text-zinc-400">Factura #TEMP-000{i+1}</p>
                    <p className="text-[10px] text-zinc-600">---</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-zinc-700 uppercase">Sin registros</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-zinc-600 font-medium text-center italic">
            Las facturas aparecerán aquí una vez comience tu ciclo de facturación.
          </p>
        </div>
      </motion.div>

      {/* Security Info */}
      <div className="flex items-center justify-center gap-6 py-8 border-t border-white/[0.04]">
        <div className="flex items-center gap-2 opacity-40">
          <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-5 brightness-0 invert" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Secure Payments</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <p className="text-[10px] text-zinc-600 font-medium max-w-sm text-center">
          Tus datos de pago están encriptados y procesados exclusivamente por Stripe. Tempos no almacena información sensible de tarjetas.
        </p>
      </div>
    </div>
  );
}
