import React, { useCallback, useMemo, useState, lazy, Suspense } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { getClientSession, acceptTerms, clockIn, clockOut } from '@/lib/api';
import { z } from 'zod';

// Icons
import { ShieldCheck, CheckCircle } from '@phosphor-icons/react';

// Modular Components
import DashboardShell from '@/components/dashboard/DashboardShell';
import QuickClock from '@/components/dashboard/QuickClock';
import MobileQuickClock from '@/components/dashboard/MobileQuickClock';
import { Capacitor } from '@capacitor/core';

// Lazy Loaded Modular Tabs (Optimizes initial load bundle)
const HomeHub = lazy(() => import('@/components/dashboard/HomeHub'));
const EmployeeTab = lazy(() => import('@/components/dashboard/EmployeeTab'));
const AttendanceTab = lazy(() => import('@/components/dashboard/AttendanceTab'));
const AnalisisTab = lazy(() => import('@/components/dashboard/AnalisisTab'));
const InformesTab = lazy(() => import('@/components/dashboard/InformesTab'));
const NominasTab = lazy(() => import('@/components/dashboard/NominasTab'));
const HorariosTab = lazy(() => import('@/components/dashboard/HorariosTab'));
const SedesTab = lazy(() => import('@/components/dashboard/SedesTab'));
const AusenciasTab = lazy(() => import('@/components/dashboard/AusenciasTab'));
const DocumentosTab = lazy(() => import('@/components/dashboard/DocumentosTab'));
const MensajesTab = lazy(() => import('@/components/dashboard/MensajesTab'));
const PerfilTab = lazy(() => import('@/components/dashboard/PerfilTab'));
const ConfiguracionTab = lazy(() => import('@/components/dashboard/ConfiguracionTab'));
const GeoMapaTab = lazy(() => import('@/components/dashboard/GeoMapaTab'));
const PlanesTab = lazy(() => import('@/components/dashboard/PlanesTab'));
const ComplianceTab = lazy(() => import('@/components/dashboard/ComplianceTab'));

// Lazy Loaded Specific Forms & Heavy Modals
const ScheduleForm = lazy(() => import('@/components/dashboard/ScheduleForm'));
const ShiftAssignForm = lazy(() => import('@/components/dashboard/ShiftAssignForm'));
const EmpleadoForm = lazy(() => import('@/components/dashboard/EmpleadoForm'));
const WorkCenterForm = lazy(() => import('@/components/dashboard/WorkCenterForm'));
const DocumentoForm = lazy(() => import('@/components/dashboard/DocumentoForm'));
const AusenciaForm = lazy(() => import('@/components/dashboard/AusenciaForm'));
const FichaForm = lazy(() => import('@/components/dashboard/FichaForm'));
const CorrectionRequestForm = lazy(() => import('@/components/dashboard/CorrectionRequestForm'));
const ExpedienteEmpleado = lazy(() => import('@/components/dashboard/ExpedienteEmpleado'));
const AuditTrailModal = lazy(() => import('@/components/dashboard/AuditTrailModal'));
const TrialExpiredOverlay = lazy(() => import('@/components/dashboard/TrialExpiredOverlay'));

// Existing UI Components
import ModalBase from '@/components/dashboard/ModalBase';
import GeolocationConsentModal from '@/components/GeolocationConsentModal';

// Hooks
import { useGeolocation } from '@/hooks/useGeolocation';
import { useClockTimer } from '@/hooks/useClockTimer';
import { useAutoClock } from '@/hooks/useAutoClock';
import { FeedbackProvider, useFeedback } from '@/context/FeedbackContext';
import { useModalManager } from '@/hooks/useModalManager';
import { useEmployeeMutations } from '@/hooks/useEmployeeMutations';
import { useWorkCenterMutations } from '@/hooks/useWorkCenterMutations';
import { useScheduleMutations } from '@/hooks/useScheduleMutations';
import { useDocumentMutations } from '@/hooks/useDocumentMutations';
import { useAbsenceMutations } from '@/hooks/useAbsenceMutations';
import { useFichaMutations } from '@/hooks/useFichaMutations';
import { useClockMutations } from '@/hooks/useClockMutations';
import { useExportActions } from '@/hooks/useExportActions';
import Loader from '@/components/dashboard/Loader';
import ErrorComponent from '@/components/dashboard/Error';
import TabErrorBoundary from '@/components/TabErrorBoundary';
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard';

function DashboardPageInner() {
  // Esquema de validación para Empleados (Producción)
  const employeeSchema = z.object({
    displayName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    email: z.string().email("El formato del email no es válido"),
    role: z.enum(['admin', 'manager', 'employee'], { 
      errorMap: () => ({ message: "Selecciona un rango de autoridad válido" }) 
    }),
    dni: z.string().min(8, "El DNI/NIE debe ser válido"),
    phone: z.string().optional(),
    hourlyRate: z.coerce.number().min(0, "La tarifa no puede ser negativa"),
    workCenterId: z.string().optional(),
    status: z.enum(['active', 'suspended'])
  });

  const [activeTab, setActiveTab] = useState('Inicio');
  const [registrosFilters, setRegistrosFilters] = useState({ employeeId: '', startDate: '', endDate: '' });

  // Hook de Datos Centralizado
  const {
    profile, setProfile,
    activeFicha, setActiveFicha,
    clockedIn, setClockedIn,
    isOnBreak, setIsOnBreak,
    employees, setEmployees,
    documents, setDocuments,
    absences, setAbsences,
    registros, setRegistros,
    workCenters, setWorkCenters,
    dashboardStats, setDashboardStats,
    schedules, setSchedules,
    shiftAssignments, setShiftAssignments,
    loading,
    setLoading,
    isTrialExpired,
    loadData,
    handleLogout
  } = useDashboardData(registrosFilters);

  // 🔄 Recarga completa de todas las entidades del dashboard
  const refreshAllData = useCallback(async () => {
    await loadData('all');
  }, [loadData]);

  const isMobile = useMemo(() => Capacitor.isNativePlatform(), []);
  const isAdmin = useMemo(() => profile?.role === 'admin' || profile?.role === 'manager', [profile]);

  const [welcomeDismissed, setWelcomeDismissed] = useState(
    () => !!localStorage.getItem('tempos.onboarding_welcome_dismissed')
  );

  const showWelcome = useMemo(() =>
    isAdmin && employees.length === 0 && workCenters.length === 0 && !welcomeDismissed && !loading,
    [isAdmin, employees, workCenters, welcomeDismissed, loading]
  );

  // UI States
  const [stats, setStats] = useState({ activeEmployees: 0, presentNow: 0, totalHoursMonth: 0, pendingAbsences: 0 });
  const [dailyStats, setDailyStats] = useState([]);
  const [auditLogRows, setAuditLogRows] = useState([]);
  const [auditFilters, setAuditFilters] = useState({ action: '', userId: '', startDate: '', endDate: '' });
  const { location: geoLocation, error: geoError, loading: geoLoading, consentGiven, requestLocation, revokeConsent } = useGeolocation();

  const elapsedWorkingTime = useClockTimer(activeFicha, clockedIn, isOnBreak);

  const { showFeedback } = useFeedback();
  const modalManager = useModalManager();

  const employeeMutations = useEmployeeMutations({ showFeedback, refreshAllData });
  const workCenterMutations = useWorkCenterMutations({ showFeedback, refreshAllData });
  const scheduleMutations = useScheduleMutations({ showFeedback, refreshAllData });
  const documentMutations = useDocumentMutations({ showFeedback, refreshAllData });
  const absenceMutations = useAbsenceMutations({ showFeedback, refreshAllData });
  const fichaMutations = useFichaMutations({ showFeedback, refreshAllData });
  const clockMutations = useClockMutations({ showFeedback, refreshAllData, setClockedIn, setIsOnBreak, setActiveFicha });
  const exportActions = useExportActions({ showFeedback, auditFilters, setAuditFilters, setAuditLogRows });

  const checklistSteps = useMemo(() => {
    if (!isAdmin) return null;
    return {
      employees: employees.length > 0,
      workCenters: workCenters.length > 0,
      schedules: schedules.length > 0,
      clock: activeFicha !== null
    };
  }, [isAdmin, employees, workCenters, schedules, activeFicha]);

  // 🔔 Sistema de Notificaciones Reales
  const realNotifications = useMemo(() => {
    const list = [];
    if (!profile) return list;

    if (isAdmin) {
      // 1. Ausencias pendientes (Admin)
      const pendingAbs = (absences || []).filter(a => a.status === 'pending');
      pendingAbs.forEach(a => {
        list.push({
          id: `abs-${a.id}`,
          title: 'Solicitud de Ausencia',
          desc: `${a.employeeName || 'Un empleado'} solicita ${a.type}`,
          type: 'absence',
          time: 'Pendiente'
        });
      });

      // 2. Registros anómalos (Si existen)
      const anomalies = (registros || []).filter(r => r.metadata?.outside_zone).slice(0, 2);
      anomalies.forEach(r => {
        list.push({
          id: `reg-${r.id}`,
          title: 'Fichaje fuera de zona',
          desc: `${r.employeeName || 'Empleado'} fichó fuera del radio permitido`,
          type: 'warning',
          time: 'Revisar'
        });
      });
    } else {
      // 1. Mis ausencias aprobadas/rechazadas recientemente
      const myAbs = (absences || []).filter(a => a.status !== 'pending').slice(0, 3);
      myAbs.forEach(a => {
        list.push({
          id: `abs-${a.id}`,
          title: a.status === 'approved' ? 'Ausencia Aprobada' : 'Ausencia Rechazada',
          desc: `Tu solicitud de ${a.type} ha sido ${a.status === 'approved' ? 'validada' : 'denegada'}`,
          type: a.status === 'approved' ? 'success' : 'warning',
          time: 'Actualizado'
        });
      });
    }

    return list;
  }, [profile, isAdmin, absences, registros]);

  // 🔒 Auto-Clock (Geofencing automático para empleados en móvil)
  const {
    autoClockStatus,
    lastCheck: autoClockLastCheck,
    nearestCenter: autoClockCenter,
    distanceMeters: autoClockDistance,
  } = useAutoClock({
    workCenters,
    clockedIn,
    clockInFn: clockIn,
    clockOutFn: clockOut,
    enabled: isMobile && !isAdmin, // Solo para empleados en móvil
    onClockAction: async (result) => {
      // Recargar datos después de un fichaje automático
      await loadData('core');
      if (result.action === 'clock_in') {
        setClockedIn(true);
        showFeedback('success', `✅ Entrada automática en ${result.center || 'tu centro'}`);
      } else if (result.action === 'clock_out') {
        setClockedIn(false);
        setActiveFicha(null);
        showFeedback('success', `🚪 Salida automática de ${result.center || 'tu centro'}`);
      }
    },
  });

  const closeModal = modalManager.closeModal;

  const openModal = modalManager.openModal;

  const handleAcceptTerms = async () => {
    setLoading(true);
    try {
      const session = getClientSession();
      await acceptTerms(session.token);
      modalManager.setAcceptedTerms(true);
      setProfile(prev => ({ ...prev, hasAcceptedTerms: true }));
      showFeedback('success', 'Términos aceptados correctamente.');
    } catch (err) {
      showFeedback('error', 'Error al aceptar términos.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismissWelcome = useCallback(() => {
    localStorage.setItem('tempos.onboarding_welcome_dismissed', 'true');
    setWelcomeDismissed(true);
  }, []);

  const handleWelcomeAction = useCallback((type) => {
    localStorage.setItem('tempos.onboarding_welcome_dismissed', 'true');
    setWelcomeDismissed(true);
    if (type === 'employees') setActiveTab('Equipo');
    if (type === 'workCenters') setActiveTab('Sedes');
  }, []);

  const handleChecklistNavigate = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const onClockToggle = useCallback(async () => {
    const result = await clockMutations.handleClockToggle({
      requestLocation,
      consentGiven,
      requiresGeo: profile?.requiresGeolocation,
      isCurrentlyClockedIn: clockedIn,
    });
    if (result === 'requires_consent') {
      modalManager.setGeolocationConsent(true);
    }
  }, [clockMutations, requestLocation, consentGiven, profile, clockedIn, modalManager]);

  const onBreakToggle = useCallback(async () => {
    await clockMutations.handleBreakToggle({ isCurrentlyOnBreak: isOnBreak });
  }, [clockMutations, isOnBreak]);



  const onEmployeeSubmit = useCallback(async (values) => {
    setLoading(true);
    try {
      await employeeMutations.handleEmployeeSubmit(values, modalManager.modalMode, modalManager.modalData);
      closeModal();
    } finally {
      setLoading(false);
    }
  }, [employeeMutations, modalManager.modalMode, modalManager.modalData, closeModal, setLoading]);

  const handleGeolocationConsentAccept = async () => {
    modalManager.setGeolocationConsent(false);
    modalManager.setGeolocationMode('consent');
    await onClockToggle();
  };

  const handleGeolocationConsentDeny = () => {
    modalManager.setGeolocationConsent(false);
    modalManager.setGeolocationMode('consent');
    showFeedback('error', 'Se requiere consentimiento de geolocalización para fichar.');
  };

  const handleGeolocationConsentRevoke = () => {
    revokeConsent();
    modalManager.setGeolocationConsent(false);
    modalManager.setGeolocationMode('consent');
    showFeedback('success', 'Consentimiento de geolocalización revocado. Ya no se recopilarán datos de ubicación.');
  };

  const openRevokeModal = () => {
    modalManager.setGeolocationMode('revoke');
    modalManager.setGeolocationConsent(true);
  };

  const onFichaSubmit = useCallback(async (data) => {
    setLoading(true);
    try {
      await fichaMutations.handleFichaSubmit(data, modalManager.modalMode, modalManager.modalData);
      closeModal();
    } finally {
      setLoading(false);
    }
  }, [fichaMutations, modalManager.modalMode, modalManager.modalData, closeModal, setLoading]);

  const onWorkCenterSubmit = useCallback(async (values) => {
    await workCenterMutations.handleWorkCenterSubmit(values, modalManager.modalMode, modalManager.modalData);
    closeModal();
  }, [workCenterMutations, modalManager.modalMode, modalManager.modalData, closeModal]);

  const onCorrectionSubmit = useCallback(async (values) => {
    setLoading(true);
    try {
      await fichaMutations.handleCorrectionSubmit(values, modalManager.modalMode, modalManager.modalData);
      closeModal();
    } finally {
      setLoading(false);
    }
  }, [fichaMutations, modalManager.modalMode, modalManager.modalData, closeModal, setLoading]);

  const onReviewCorrection = useCallback(async (decision, comment) => {
    setLoading(true);
    try {
      await fichaMutations.handleReviewCorrection(decision, comment, modalManager.modalData);
      closeModal();
    } finally {
      setLoading(false);
    }
  }, [fichaMutations, modalManager.modalData, closeModal, setLoading]);

  const onScheduleSubmit = useCallback(async (data) => {
    setLoading(true);
    try {
      await scheduleMutations.handleScheduleSubmit(data, modalManager.modalMode, modalManager.modalData);
      closeModal();
    } finally {
      setLoading(false);
    }
  }, [scheduleMutations, modalManager.modalMode, modalManager.modalData, closeModal, setLoading]);

  const onDocumentSubmit = useCallback(async (values) => {
    await documentMutations.handleDocumentSubmit(values);
    closeModal();
  }, [documentMutations, closeModal]);

  const onAbsenceSubmit = useCallback(async (values) => {
    await absenceMutations.handleAbsenceSubmit(values);
    closeModal();
  }, [absenceMutations, closeModal]);

  const pendingAbsences = useMemo(
    () => (Array.isArray(absences) ? absences : []).filter((item) => item.status === 'pending'),
    [absences]
  );

  if (loading) return <Loader />;

  if (!profile) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0c]">
        <ErrorComponent 
          message="No se pudo cargar tu perfil. Es posible que haya un problema de conexión con el servidor. Por favor, inténtalo de nuevo." 
          onRetry={handleLogout} 
          retryText="Volver al Login"
        />
      </div>
    );
  }

  // ─── VISTA EMPLEADO: Interfaz dedicada ───
  if (!isAdmin) {
    return (
      <EmployeeDashboard
        profile={profile}
        clockedIn={clockedIn}
        isOnBreak={isOnBreak}
        activeFicha={activeFicha}
        elapsedTime={elapsedWorkingTime}
        registros={registros}
        absences={absences}
        workCenters={workCenters}
        onClockToggle={onClockToggle}
        onBreakToggle={onBreakToggle}
        onRequestAbsence={() => openModal('ausencia')}
        onLogout={handleLogout}
        autoClockStatus={autoClockStatus}
        autoClockCenter={autoClockCenter}
        autoClockDistance={autoClockDistance}
        onRefresh={refreshAllData}
      />
    );
  }

  // ─── ADMIN: Dashboard completo ───
  return (
    <DashboardShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
      profile={profile}
      notifications={realNotifications}
      showWelcome={showWelcome}
      onDismissWelcome={handleDismissWelcome}
      onWelcomeAction={handleWelcomeAction}
      checklistSteps={checklistSteps}
      onChecklistNavigate={handleChecklistNavigate}
    >
      {!isMobile && (
        <div className="mb-10">
          <QuickClock 
            clockedIn={clockedIn}
            isOnBreak={isOnBreak}
            onClockToggle={onClockToggle}
            onBreakToggle={onBreakToggle}
            elapsedTime={elapsedWorkingTime}
          />
        </div>
      )}

      <TabErrorBoundary>
        <div className="flex-1">
          {isMobile && !isAdmin && activeTab === 'Inicio' ? (
            <MobileQuickClock
              clockedIn={clockedIn}
              onClockToggle={onClockToggle}
              elapsedTime={elapsedWorkingTime}
            />
          ) : (
            <Suspense fallback={<Loader />}>
              {activeTab === 'Inicio' && (
                <HomeHub 
                  profile={profile}
                  setActiveTab={setActiveTab}
                  stats={{
                    working: dashboardStats?.metrics?.working || 0,
                    totalEmployees: employees.length,
                    todayRegistros: registros.filter(r => r.startTime?.includes(new Date().toISOString().split('T')[0])).length,
                    pendingAbsences: stats.pendingAbsences || 0
                  }}
                />
              )}

              {activeTab === 'Equipo' && (
                <EmployeeTab 
                  employees={employees}
                  onAddEmployee={() => openModal('empleado')}
                  onEditEmployee={(emp) => openModal('empleado', 'edit', emp)}
                  onDeleteEmployee={employeeMutations.handleEmployeeDelete}
                  onViewExpediente={modalManager.setSelectedEmployee}
                />
              )}

              {activeTab === 'GeoMapa' && (
                <GeoMapaTab
                  registros={registros}
                  workCenters={workCenters}
                  employees={employees}
                />
              )}

              {activeTab === 'Registros' && (
                <AttendanceTab 
                  registros={registros} 
                  filters={registrosFilters}
                  setFilters={setRegistrosFilters}
                  onExport={exportActions.handleExportReport}
                  employees={employees}
                  workCenters={workCenters}
                  profile={profile}
                  onEdit={(row) => {
                    if (isAdmin) {
                      if (row.status === 'disputed') openModal('review_correction', 'edit', row);
                      else openModal('registros', 'edit', row);
                    } else {
                      openModal('correction', 'edit', row);
                    }
                  }}
                  onViewAudit={(row) => { modalManager.openAudit(row.id); }}
                />
              )}

              {activeTab === 'Horarios' && (
                <HorariosTab 
                  employees={employees}
                  schedules={schedules || []}
                  assignments={shiftAssignments}
                  isAdmin={isAdmin}
                  profile={profile}
                  onAssign={(emp, date) => openModal('assign_shift', 'create', { userId: emp.id, startDate: date.toISOString().split('T')[0] })}
                  onAddTemplate={() => openModal('schedule')}
                  onEditTemplate={(sch) => openModal('schedule', 'edit', sch)}
                  onDeleteTemplate={scheduleMutations.handleScheduleDelete}
                />
              )}

              {activeTab === 'Sedes' && (
                <SedesTab 
                  workCenters={workCenters || []}
                  profile={profile}
                  onAdd={() => openModal('workcenter')}
                  onEdit={(wc) => openModal('workcenter', 'edit', wc)}
                  onDelete={workCenterMutations.handleWorkCenterDelete}
                />
              )}

              {activeTab === 'Legal' && (
                <ComplianceTab onExportInspection={exportActions.handleExportReport} />
              )}

              {activeTab === 'Ausencias' && (
                <AusenciasTab
                  pendingAbsences={pendingAbsences}
                  isAdmin={isAdmin}
                  profile={profile}
                  onRequestAbsence={() => openModal('ausencia')}
                  onActOnAbsence={absenceMutations.actOnAbsence}
                />
              )}

              {activeTab === 'Documentos' && (
                <DocumentosTab
                  documents={documents}
                  isAdmin={isAdmin}
                  onUpload={() => openModal('documento')}
                  onView={documentMutations.handleDownloadDocument}
                  onSign={documentMutations.handleSignDocument}
                  onDelete={documentMutations.handleDocumentDelete}
                />
              )}

              {activeTab === 'Análisis' && (
                <AnalisisTab
                  registros={registros}
                  workCenters={workCenters}
                  employees={employees}
                />
              )}

              {activeTab === 'Informes' && (
                <InformesTab 
                  auditLogs={auditLogRows}
                  onExportAudit={exportActions.handleExportAudit}
                  onExportInspection={exportActions.handleExportReport}
                  onResetFilters={exportActions.handleResetAuditFilters}
                  registros={registros}
                  workCenters={workCenters}
                  employees={employees}
                />
              )}

              {activeTab === 'Nóminas' && (
                <NominasTab
                  employees={employees}
                  documents={documents}
                  onUploadDocument={() => openModal('documento')}
                />
              )}

              {activeTab === 'Mensajes' && (
                <MensajesTab profile={profile} employees={employees} />
              )}

              {activeTab === 'Mi Perfil' && (
                <PerfilTab 
                  profile={profile || {}}
                  consentGiven={consentGiven}
                  openRevokeModal={openRevokeModal}
                  onUpdate={() => loadData('core')}
                />
              )}

              {activeTab === 'Planes' && (
                <PlanesTab profile={profile} />
              )}

              {activeTab === 'Mi Empresa' && (
                <ConfiguracionTab 
                  profile={profile}
                  isAdmin={isAdmin}
                />
              )}
            </Suspense>
          )}
        </div>
      </TabErrorBoundary>


      <ModalBase open={!!modalManager.modal} onClose={closeModal} title={modalManager.modal}>
        <Suspense fallback={<Loader />}>
          {modalManager.modal === 'empleado' && (
            <EmpleadoForm 
              mode={modalManager.modalMode} 
              initialValues={modalManager.modalData} 
              onSubmit={onEmployeeSubmit}
              onCancel={closeModal}
              loading={loading}
            />
          )}
          {modalManager.modal === 'registros' && (
            <FichaForm 
              initialData={modalManager.modalData}
              onSubmit={onFichaSubmit}
              onCancel={closeModal}
              loading={loading}
            />
          )}
          {modalManager.modal === 'correction' && (
            <CorrectionRequestForm 
              initialData={modalManager.modalData}
              onSubmit={onCorrectionSubmit}
              onCancel={closeModal}
              loading={loading}
            />
          )}
          {modalManager.modal === 'review_correction' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-amber-500">Solicitud de Corrección</h4>
                <p className="text-[13px] text-zinc-300"><strong>Motivo:</strong> {modalManager.modalData?.metadata?.correctionRequest?.reason}</p>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-[10px] text-zinc-600 font-bold uppercase">Anterior</p>
                    <p className="text-xs text-zinc-400">{modalManager.modalData?.startTime} - {modalManager.modalData?.endTime}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <p className="text-[10px] text-blue-500 font-bold uppercase">Propuesto</p>
                    <p className="text-xs text-blue-400">
                      {modalManager.modalData?.metadata?.correctionRequest?.proposedChanges?.startTime || modalManager.modalData?.startTime} - {modalManager.modalData?.metadata?.correctionRequest?.proposedChanges?.endTime || modalManager.modalData?.endTime}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Comentario de Revisión (Opcional)</label>
                <textarea 
                  id="reviewComment"
                  className="w-full bg-[#111114] border border-white/[0.06] rounded-xl py-3 px-4 text-sm text-white focus:ring-1 focus:ring-blue-600 outline-none transition-all min-h-[80px] resize-none"
                  placeholder="Indica el motivo de la aprobación o rechazo..."
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => onReviewCorrection('rejected', document.getElementById('reviewComment').value)}
                  className="flex-1 px-6 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all"
                  disabled={loading}
                >
                  Rechazar
                </button>
                <button
                  onClick={() => onReviewCorrection('approved', document.getElementById('reviewComment').value)}
                  className="flex-[2] px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20"
                  disabled={loading}
                >
                  Aprobar y Aplicar
                </button>
              </div>
            </div>
          )}
          {modalManager.modal === 'workcenter' && (
            <WorkCenterForm 
              initialData={modalManager.modalData} 
              onSubmit={onWorkCenterSubmit} 
              onCancel={closeModal} 
              loading={loading}
              profile={profile} 
            />
          )}
          {modalManager.modal === 'ausencia' && <AusenciaForm onSubmit={onAbsenceSubmit} onCancel={closeModal} loading={loading} />}
          {modalManager.modal === 'documento' && <DocumentoForm onSubmit={onDocumentSubmit} onCancel={closeModal} loading={loading} />}
          {modalManager.modal === 'schedule' && (
            <ScheduleForm 
              mode={modalManager.modalMode}
              initialValues={modalManager.modalData}
              onSubmit={onScheduleSubmit} 
              onCancel={closeModal} 
              loading={loading}
            />
          )}
          {modalManager.modal === 'assign_shift' && <ShiftAssignForm 
            initialValues={modalManager.modalData} 
            employees={employees} 
            schedules={schedules} 
            onSubmit={async (data) => { 
              await scheduleMutations.handleAssignShift(data); 
              closeModal(); 
            }} 
            onCancel={closeModal} 
          />}
        </Suspense>
      </ModalBase>

      {/* MODAL DE CONSENTIMIENTO LEGAL OBLIGATORIO */}
      {profile && !profile.hasAcceptedTerms && !modalManager.hasAcceptedLocal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="relative w-full max-w-xl bg-[#0d0d0f] border border-white/[0.08] rounded-[32px] p-8 shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500">
              <ShieldCheck weight="fill" size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">Transparencia y Protección de Datos</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Para cumplir con el **Art. 34.9 del Estatuto de los Trabajadores** y el **RGPD**, necesitamos informarte que Tempos HR registrará tu jornada laboral. Tus datos serán tratados de forma segura y conservados durante 4 años.
              </p>
            </div>
            
            <div className="bg-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-emerald-500 mt-1" weight="fill" size={16} />
                <p className="text-xs text-zinc-300">Aceptas el registro de jornada digital inalterable.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-emerald-500 mt-1" weight="fill" size={16} />
                <p className="text-xs text-zinc-300">Conoces tus derechos de acceso, rectificación y supresión.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button 
                onClick={handleAcceptTerms}
                className="flex-1 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Entendido, Aceptar y Continuar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        {modalManager.selectedEmployee && (
          <ExpedienteEmpleado 
            employee={modalManager.selectedEmployee} 
            onClose={() => modalManager.setSelectedEmployee(null)} 
            fichas={[]}
            onUpdate={refreshAllData}
          />
        )}
      </Suspense>

      <GeolocationConsentModal
        isOpen={modalManager.showGeolocationConsent}
        onAccept={handleGeolocationConsentAccept}
        onDeny={handleGeolocationConsentDeny}
        showRevokeOption={modalManager.geolocationModalMode === 'revoke'}
        onRevoke={handleGeolocationConsentRevoke}
      />

      <Suspense fallback={null}>
        <AuditTrailModal 
          open={modalManager.auditModalOpen}
          onClose={modalManager.closeAudit}
          fichaId={modalManager.selectedAuditFichaId}
        />

        {isTrialExpired && (
          <TrialExpiredOverlay trialExpiresAt={profile?.trialExpiresAt} />
        )}
      </Suspense>
    </DashboardShell>
  );
}

export default function DashboardPage() {
  return (
    <FeedbackProvider>
      <DashboardPageInner />
    </FeedbackProvider>
  );
}
