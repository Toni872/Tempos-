import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '@/lib/api';

// Icons
import { Clock, Users, MapPin, Calendar, FileText, Search, Download, LayoutDashboard } from 'lucide-react';

// Modular Components
import DashboardShell from '@/components/dashboard/DashboardShell';
import OverviewTab from '@/components/dashboard/OverviewTab';
import EmployeeTab from '@/components/dashboard/EmployeeTab';
import AttendanceTab from '@/components/dashboard/AttendanceTab';
import AnalisisTab from '@/components/dashboard/AnalisisTab';
import InformesTab from '@/components/dashboard/InformesTab';
import NominasTab from '@/components/dashboard/NominasTab';
import HorariosTab from '@/components/dashboard/HorariosTab';
import SedesTab from '@/components/dashboard/SedesTab';
import AusenciasTab from '@/components/dashboard/AusenciasTab';
import DocumentosTab from '@/components/dashboard/DocumentosTab';
import MensajesTab from '@/components/dashboard/MensajesTab';
import PerfilTab from '@/components/dashboard/PerfilTab';
import ConfiguracionTab from '@/components/dashboard/ConfiguracionTab';

// Specific Forms
import ScheduleForm from '@/components/dashboard/ScheduleForm';
import ShiftAssignForm from '@/components/dashboard/ShiftAssignForm';

// Existing UI Components
import ModalBase from '@/components/dashboard/ModalBase';
import GeolocationConsentModal from '@/components/GeolocationConsentModal';

// Hooks
import { useGeolocation } from '@/hooks/useGeolocation';
import Loader from '@/components/dashboard/Loader';
import Success from '@/components/dashboard/Success';
import ErrorComponent from '@/components/dashboard/Error';
import EmpleadoForm from '@/components/dashboard/EmpleadoForm';
import WorkCenterForm from '@/components/dashboard/WorkCenterForm';
import DocumentoForm from '@/components/dashboard/DocumentoForm';
import AusenciaForm from '@/components/dashboard/AusenciaForm';
import FichaForm from '@/components/dashboard/FichaForm';
import ExpedienteEmpleado from '@/components/dashboard/ExpedienteEmpleado';
import MapaAuditoria from '@/components/dashboard/MapaAuditoria';
import SchedulingGrid from '@/components/dashboard/SchedulingGrid';

import {
  getClientSession,
  clearClientSession,
  getMe,
  getDailyStats,
  listEmployees,
  createEmployee,
  deleteEmployee,
  listDocuments,
  uploadDocument,
  downloadDocument,
  signDocument,
  listAbsences,
  requestAbsence,
  approveAbsence,
  rejectAbsence,
  exportReport,
  clockIn,
  clockOut,
  getActiveFicha,
  getReportSummary,
  listAuditLog,
  exportAuditLog,
  closeFichaPeriod,
  listWorkCenters,
  deleteWorkCenter,
  listSchedules,
  createSchedule,
  listShiftAssignments,
  assignShift,
  getDashboardStats,
} from '@/lib/api';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = useCallback(() => {
    clearClientSession();
    navigate('/login', { replace: true });
  }, [navigate]);

  const [isAdmin, setIsAdmin] = useState(location.state?.isAdmin ?? true);
  const [activeTab, setActiveTab] = useState('Inicio');
  const [now, setNow] = useState(new Date());
  const [clockedIn, setClockedIn] = useState(false);

  const [apiStatus, setApiStatus] = useState({ ok: false, loading: true, message: 'Conectando...' });
  const [profile, setProfile] = useState(null);
  const [activeFicha, setActiveFicha] = useState(null);
  const [stats, setStats] = useState({ activeEmployees: 0, presentNow: 0, totalHoursMonth: 0, pendingAbsences: 0 });
  const [dailyStats, setDailyStats] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [shiftAssignments, setShiftAssignments] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [auditLogRows, setAuditLogRows] = useState([]);
  const [auditFilters, setAuditFilters] = useState({ action: '', userId: '', startDate: '', endDate: '' });
  const [registrosFilters, setRegistrosFilters] = useState({ employeeId: '', startDate: '', endDate: '' });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modal, setModal] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [modalData, setModalData] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Geolocation consent modal
  const [showGeolocationConsent, setShowGeolocationConsent] = useState(false);
  const [geolocationModalMode, setGeolocationModalMode] = useState('consent'); // 'consent' or 'revoke'
  const { location: geoLocation, error: geoError, loading: geoLoading, consentGiven, requestLocation, revokeConsent } = useGeolocation();

  const [elapsedWorkingTime, setElapsedWorkingTime] = useState('00:00:00');

  const showFeedback = (type, message) => {
    if (type === 'error') setError(message);
    else if (type === 'success') setSuccess(message);
    // Loading handled by local state or feedback modal if needed
  };

  const closeModal = () => {
    setModal(null);
    setModalData(null);
    setModalMode('create');
  };

  const openModal = (type, mode = 'create', data = null) => {
    setModal(type);
    setModalMode(mode);
    setModalData(data);
  };

  const loadCollections = async (token, isUserAdmin) => {
    try {
      // Common data for everyone
      const [docs, abs, fxs] = await Promise.all([
        listDocuments(token),
        listAbsences(token),
        api.get('/api/v1/fichas', { 
          token, 
          params: { 
            userId: registrosFilters.employeeId,
            startDate: registrosFilters.startDate,
            endDate: registrosFilters.endDate
          } 
        })
      ]);

      setDocuments(Array.isArray(docs) ? docs : []);
      setAbsences(Array.isArray(abs) ? abs : []);
      setRegistros(Array.isArray(fxs) ? fxs : (fxs?.data || []));

      // Admin only data
      if (isUserAdmin) {
        const [emp, wcs, schs, shifts, dbStats] = await Promise.all([
          listEmployees(token),
          listWorkCenters(token),
          listSchedules(token),
          listShiftAssignments(token),
          getDashboardStats(token)
        ]);
        setEmployees(emp?.data || []);
        setWorkCenters(wcs?.data || wcs || []);
        setSchedules(schs?.data || schs || []);
        setShiftAssignments(shifts?.data || shifts || []);
        setDashboardStats(dbStats);

        const activeEmp = emp?.data || [];
        const present = activeEmp.filter(e => e.isWorking).length;
        setStats(prev => ({ 
          ...prev, 
          activeEmployees: activeEmp.length, 
          presentNow: present, 
          pendingAbsences: (Array.isArray(abs) ? abs : []).filter(a => a.status === 'pending').length 
        }));
      }
    } catch (err) {
      console.error('Error loading collections:', err);
      if (err.status === 401) {
        handleLogout();
      }
    }
  };

  const refreshAllData = async () => {
    const session = getClientSession();
    if (session?.token) await loadCollections(session.token, isAdmin);
  };

  // Efecto para recargar registros cuando cambian los filtros
  useEffect(() => {
    refreshAllData();
  }, [registrosFilters]);

  useEffect(() => {
    const session = getClientSession();
    if (!session?.token) {
      navigate('/login', { replace: true });
      return;
    }

    const init = async () => {
      setLoading(true);
      try {
        const me = await getMe(session.token);
        setProfile(me);
        setIsAdmin(me.role === 'admin');

        const ficha = await getActiveFicha(session.token);
        setActiveFicha(ficha);
        setClockedIn(!!ficha);

        await loadCollections(session.token, me.role === 'admin');
        const dStats = await getDailyStats(session.token);
        setDailyStats(Array.isArray(dStats) ? dStats : []);
        
        const summary = await getReportSummary(session.token);
        setReportSummary(summary);

        setApiStatus({ ok: true, loading: false, message: 'Sistema Operativo' });
      } catch (err) {
        console.error('Init error:', err);
        if (err.status === 401) {
          handleLogout();
          return; // STOP EXECUTION
        } else {
          setApiStatus({ ok: false, loading: false, message: 'Error de conexión' });
        }
      } finally {
        setLoading(false);
      }
    };

    init();
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    if (!clockedIn || !activeFicha) {
      setElapsedWorkingTime('00:00:00');
      return;
    }
    const timer = setInterval(() => {
      const start = new Date(activeFicha.startTime).getTime();
      const diff = Date.now() - start;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsedWorkingTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [clockedIn, activeFicha]);

  const handleClockToggle = async () => {
    const session = getClientSession();
    if (!session?.token) return;

    // Check if user requires geolocation
    const currentUser = employees.find(emp => emp.uid === session.userId || emp.id === session.userId);
    const requiresGeo = currentUser?.requiresGeolocation;

    if (requiresGeo && !consentGiven) {
      setShowGeolocationConsent(true);
      return;
    }

    try {
      let payload = {};

      if (requiresGeo && consentGiven) {
        // Request location if needed
        await requestLocation();
        if (geoLocation) {
          payload = {
            latitude: geoLocation.latitude,
            longitude: geoLocation.longitude,
            accuracy: geoLocation.accuracy,
          };
        }
      }

      if (clockedIn) {
        await clockOut(session.token, payload);
        setClockedIn(false);
        setActiveFicha(null);
        showFeedback('success', 'Turno finalizado.');
      } else {
        payload.workCenterId = workCenters[0]?.id;
        const res = await clockIn(session.token, payload);
        setActiveFicha(res);
        setClockedIn(true);
        showFeedback('success', 'Turno iniciado.');
      }
      await refreshAllData();
    } catch (err) {
      showFeedback('error', 'Error al cambiar estado de fichaje.');
    }
  };

  const handleEmployeeSubmit = async (values) => {
    const session = getClientSession();
    if (!session?.token) return;
    try {
      if (modalMode === 'edit') {
        await api.put(`/api/v1/employees/${modalData.id}`, values, { token: session?.token });
      } else {
        await createEmployee(session.token, values);
      }
      await refreshAllData();
      closeModal();
      showFeedback('success', 'Empleado guardado.');
    } catch (err) {
      showFeedback('error', 'Error al guardar empleado.');
    }
  };

  const handleGeolocationConsentAccept = async () => {
    setShowGeolocationConsent(false);
    setGeolocationModalMode('consent');
    // Now proceed with clock toggle
    await handleClockToggle();
  };

  const handleGeolocationConsentDeny = () => {
    setShowGeolocationConsent(false);
    setGeolocationModalMode('consent');
    showFeedback('error', 'Se requiere consentimiento de geolocalización para fichar.');
  };

  const handleGeolocationConsentRevoke = () => {
    revokeConsent();
    setShowGeolocationConsent(false);
    setGeolocationModalMode('consent');
    showFeedback('success', 'Consentimiento de geolocalización revocado. Ya no se recopilarán datos de ubicación.');
  };

  const openRevokeModal = () => {
    setGeolocationModalMode('revoke');
    setShowGeolocationConsent(true);
  };

  const handleFichaSubmit = async (data) => {
    setLoading(true);
    try {
      const session = getClientSession();
      if (modalMode === 'edit') {
        await api.put(`/api/v1/fichas/${modalData.id}`, data, { token: session.token });
        showFeedback('success', 'Fichaje actualizado.');
      }
      await refreshAllData();
      closeModal();
    } catch (err) {
      showFeedback('error', 'Error al guardar fichaje.');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkCenterSubmit = async (values) => {
    const session = getClientSession();
    try {
      if (modalMode === 'edit') {
        await api.put(`/api/v1/work-centers/${modalData.id}`, values, { token: session?.token });
      } else {
        await api.post('/api/v1/work-centers', values, { token: session?.token });
      }
      await refreshAllData();
      closeModal();
    } catch (err) {
      showFeedback('error', 'Error al guardar centro.');
    }
  };

  const handleWorkCenterDelete = async (wc) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la sede "${wc.name}"?`)) return;
    try {
      const session = getClientSession();
      await api.delete(`/api/v1/work-centers/${wc.id}`, { token: session?.token });
      await refreshAllData();
      showFeedback('success', 'Sede eliminada correctamente.');
    } catch (err) {
      showFeedback('error', 'Error al eliminar centro.');
    }
  };

  const handleScheduleSubmit = async (data) => {
    setLoading(true);
    try {
      const session = getClientSession();
      if (modalMode === 'edit') {
        await api.put(`/api/v1/schedules/${modalData.id}`, data, { token: session?.token });
        showFeedback('success', 'Plantilla actualizada.');
      } else {
        await createSchedule(session.token, data);
        showFeedback('success', 'Nueva plantilla creada.');
      }
      await refreshAllData();
      closeModal();
    } catch (err) {
      showFeedback('error', 'Error al guardar horario.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeDelete = async (emp) => {
    if (!confirm(`¿Eliminar al empleado ${emp.name}?`)) return;
    try {
      const session = getClientSession();
      await api.delete(`/api/v1/employees/${emp.id}`, { token: session?.token });
      await refreshAllData();
      showFeedback('success', 'Empleado eliminado correctamente.');
    } catch (err) {
      showFeedback('error', 'Error al eliminar empleado.');
    }
  };

  const handleDownloadDocument = async (doc) => {
    showFeedback('success', `Descargando ${doc.title}...`);
    // Placeholder logic for downloading the document URL
    if (doc.url) window.open(doc.url, '_blank');
  };

  const handleSignDocument = async (doc) => {
    showFeedback('success', `Iniciando flujo de firma para ${doc.title}...`);
    // Placeholder logic for signing
  };

  const handleScheduleDelete = async (sch) => {
    if (!confirm(`¿Borrar plantilla de horario "${sch.name}"?`)) return;
    try {
      const session = getClientSession();
      await api.delete(`/api/v1/schedules/${sch.id}`, { token: session?.token });
      await refreshAllData();
      showFeedback('success', 'Plantilla eliminada.');
    } catch (err) {
      showFeedback('error', 'Error al eliminar horario.');
    }
  };

  const handleDocumentSubmit = async (values) => {
    const session = getClientSession();
    try {
      const fd = new FormData();
      fd.append('title', values.title);
      fd.append('type', values.type || 'other');
      if (values.file) fd.append('file', values.file);
      await uploadDocument(session.token, fd);
      await refreshAllData();
      closeModal();
    } catch (err) {
      showFeedback('error', 'Error al subir documento.');
    }
  };

  const handleAbsenceSubmit = async (values) => {
    const session = getClientSession();
    try {
      await requestAbsence(session.token, values);
      await refreshAllData();
      closeModal();
    } catch (err) {
      showFeedback('error', 'Error al solicitar ausencia.');
    }
  };

  const actOnAbsence = async (id, action) => {
    const session = getClientSession();
    try {
      if (action === 'approve') await approveAbsence(session.token, id);
      else await rejectAbsence(session.token, id);
      await refreshAllData();
    } catch (err) {
      showFeedback('error', 'Error al procesar ausencia.');
    }
  };

  const handleExportReport = async () => {
    const session = getClientSession();
    try {
      const blob = await exportReport(session.token, { format: 'pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'informe_inspeccion.pdf';
      a.click();
    } catch (err) {
      showFeedback('error', 'Error al exportar.');
    }
  };

  const handleExportAudit = async (format) => {
    const session = getClientSession();
    try {
      const blob = await exportAuditLog(session.token, { ...auditFilters, format });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria.${format}`;
      a.click();
    } catch (err) {
      showFeedback('error', 'Error al exportar auditoria.');
    }
  };

  const handleApplyAuditFilters = async () => {
    const session = getClientSession();
    try {
      const logs = await listAuditLog(session.token, auditFilters);
      setAuditLogRows(logs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetAuditFilters = () => {
    setAuditFilters({ action: '', userId: '', startDate: '', endDate: '' });
  };

  const pendingAbsences = useMemo(
    () => (Array.isArray(absences) ? absences : []).filter((item) => item.status === 'pending'),
    [absences]
  );

  if (loading) return <Loader />;

  return (
    <DashboardShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
      profile={profile}
    >
      {activeTab === 'Inicio' && (
        <OverviewTab 
          profile={profile}
          employees={employees}
          registros={registros}
          dashboardStats={dashboardStats}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'Equipo' && (
        <EmployeeTab 
          employees={employees}
          onAddEmployee={() => openModal('empleado')}
          onEditEmployee={(emp) => openModal('empleado', 'edit', emp)}
          onDeleteEmployee={handleEmployeeDelete}
          onViewExpediente={setSelectedEmployee}
        />
      )}

      {activeTab === 'Registros' && (
        <AttendanceTab 
          registros={registros} 
          filters={registrosFilters}
          setFilters={setRegistrosFilters}
          onExport={handleExportReport}
          employees={employees}
          workCenters={workCenters}
          onEdit={(row) => openModal('registros', 'edit', row)}
        />
      )}

      {activeTab === 'Horarios' && (
        <HorariosTab 
          employees={employees}
          schedules={schedules}
          assignments={shiftAssignments}
          isAdmin={isAdmin}
          profile={profile}
          onAssign={(emp, date) => openModal('assign_shift', 'create', { userId: emp.id, startDate: date.toISOString().split('T')[0] })}
          onAddTemplate={() => openModal('schedule')}
          onEditTemplate={(sch) => openModal('schedule', 'edit', sch)}
          onDeleteTemplate={handleScheduleDelete}
        />
      )}

      {activeTab === 'Sedes' && (
        <SedesTab 
          workCenters={workCenters}
          onAdd={() => openModal('workcenter')}
          onEdit={(wc) => openModal('workcenter', 'edit', wc)}
          onDelete={handleWorkCenterDelete}
        />
      )}

      {activeTab === 'Ausencias' && (
        <AusenciasTab
          pendingAbsences={pendingAbsences}
          isAdmin={isAdmin}
          onRequestAbsence={() => openModal('ausencia')}
          onActOnAbsence={actOnAbsence}
        />
      )}

      {activeTab === 'Documentos' && (
        <DocumentosTab
          documents={documents}
          isAdmin={isAdmin}
          onUploadDocument={() => openModal('documento')}
          onDownloadDocument={handleDownloadDocument}
          onSignDocument={handleSignDocument}
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
          onExportAudit={handleExportAudit}
          onExportInspection={handleExportReport}
          onResetFilters={handleResetAuditFilters}
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
        <MensajesTab profile={profile} />
      )}

      {activeTab === 'Mi Perfil' && (
        <PerfilTab 
          profile={profile}
          consentGiven={consentGiven}
          openRevokeModal={openRevokeModal}
        />
      )}

      {activeTab === 'Mi Empresa' && (
        <ConfiguracionTab 
          profile={profile}
          isAdmin={isAdmin}
        />
      )}

      {activeTab === 'Ajustes' && (
        <PerfilTab 
          profile={profile}
          consentGiven={consentGiven}
          openRevokeModal={openRevokeModal}
          isSettings={true}
        />
      )}

      <ModalBase open={!!modal} onClose={closeModal} title={modal}>
        {modal === 'empleado' && (
          <EmpleadoForm 
            mode={modalMode} 
            initialValues={modalData} 
            onSubmit={handleEmployeeSubmit}
            onCancel={closeModal}
            loading={loading}
          />
        )}
        {modal === 'registros' && (
          <FichaForm 
            initialData={modalData}
            onSubmit={handleFichaSubmit}
            onCancel={closeModal}
            loading={loading}
          />
        )}
        {modal === 'workcenter' && (
          <WorkCenterForm 
            initialData={modalData} 
            onSubmit={handleWorkCenterSubmit} 
            onCancel={closeModal} 
            loading={loading} 
          />
        )}
        {modal === 'ausencia' && <AusenciaForm onSubmit={handleAbsenceSubmit} onCancel={closeModal} loading={loading} />}
        {modal === 'documento' && <DocumentoForm onSubmit={handleDocumentSubmit} onCancel={closeModal} loading={loading} />}
        {modal === 'schedule' && (
          <ScheduleForm 
            mode={modalMode}
            initialValues={modalData}
            onSubmit={handleScheduleSubmit} 
            onCancel={closeModal} 
            loading={loading}
          />
        )}
        {modal === 'assign_shift' && <ShiftAssignForm initialValues={modalData} employees={employees} schedules={schedules} onSubmit={async (data) => { 
          try { 
            const session = getClientSession();
            await assignShift(session.token, data); 
            closeModal(); 
            refreshAllData(); 
            showFeedback('success', 'Turno asignado.');
          } catch (err) { showFeedback('error', 'Error al asignar turno.'); } 
        }} onCancel={closeModal} />}
      </ModalBase>

      {selectedEmployee && (
        <ExpedienteEmpleado 
          employee={selectedEmployee} 
          onClose={() => setSelectedEmployee(null)} 
          fichas={[]}
          onUpdate={refreshAllData}
        />
      )}

      {success && <Success message={success} onClose={() => setSuccess('')} />}
      {error && <ErrorComponent message={error} onClose={() => setError('')} />}

      <GeolocationConsentModal
        isOpen={showGeolocationConsent}
        onAccept={handleGeolocationConsentAccept}
        onDeny={handleGeolocationConsentDeny}
        showRevokeOption={geolocationModalMode === 'revoke'}
        onRevoke={handleGeolocationConsentRevoke}
      />
    </DashboardShell>
  );
}
