import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '@/lib/api';

// Icons
import { Clock, Users, MapPin, Calendar, FileText, Search, Download, LayoutDashboard } from 'lucide-react';
import { ShieldCheck, CheckCircle } from '@phosphor-icons/react';

// Modular Components
import DashboardShell from '@/components/dashboard/DashboardShell';
import OverviewTab from '@/components/dashboard/OverviewTab';
import HomeHub from '@/components/dashboard/HomeHub';
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
import GeoMapaTab from '@/components/dashboard/GeoMapaTab';
import QuickClock from '@/components/dashboard/QuickClock';
import AuditTrailModal from '@/components/dashboard/AuditTrailModal';

// Specific Forms
import ScheduleForm from '@/components/dashboard/ScheduleForm';
import ShiftAssignForm from '@/components/dashboard/ShiftAssignForm';

// Existing UI Components
import ModalBase from '@/components/dashboard/ModalBase';
import GeolocationConsentModal from '@/components/GeolocationConsentModal';

// Hooks
import { useGeolocation } from '@/hooks/useGeolocation';
import { useClockTimer } from '@/hooks/useClockTimer';
import Loader from '@/components/dashboard/Loader';
import Success from '@/components/dashboard/Success';
import ErrorComponent from '@/components/dashboard/Error';
import EmpleadoForm from '@/components/dashboard/EmpleadoForm';
import WorkCenterForm from '@/components/dashboard/WorkCenterForm';
import DocumentoForm from '@/components/dashboard/DocumentoForm';
import AusenciaForm from '@/components/dashboard/AusenciaForm';
import FichaForm from '@/components/dashboard/FichaForm';
import CorrectionRequestForm from '@/components/dashboard/CorrectionRequestForm';
import ComplianceTab from '@/components/dashboard/ComplianceTab';
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
  acceptTerms,
  listAbsences,
  requestAbsence,
  approveAbsence,
  rejectAbsence,
  exportReport,
  clockIn,
  clockOut,
  breakStart,
  breakEnd,
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
  listFichas,
  getDashboardStats,
} from '@/lib/api';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = useCallback(() => {
    clearClientSession();
    navigate('/login', { replace: true });
  }, [navigate]);

  const [activeTab, setActiveTab] = useState('Inicio');
  const [clockedIn, setClockedIn] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);

  const [profile, setProfile] = useState(null);
  const isAdmin = useMemo(() => profile?.role === 'admin' || profile?.role === 'manager', [profile]);
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
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedAuditFichaId, setSelectedAuditFichaId] = useState(null);
  const [registrosFilters, setRegistrosFilters] = useState({ employeeId: '', startDate: '', endDate: '' });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modal, setModal] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [modalData, setModalData] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [showGeolocationConsent, setShowGeolocationConsent] = useState(false);
  const [geolocationModalMode, setGeolocationModalMode] = useState('consent'); // 'consent' or 'revoke'
  const { location: geoLocation, error: geoError, loading: geoLoading, consentGiven, requestLocation, revokeConsent } = useGeolocation();

  const elapsedWorkingTime = useClockTimer(activeFicha, clockedIn, isOnBreak);

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

  const loadCollections = useCallback(async (token, isUserAdmin = true) => {
    try {
      // Common data for everyone
      const [docs, abs, fxs] = await Promise.all([
        listDocuments(token),
        listAbsences(token),
        listFichas(token, { 
          userId: registrosFilters.employeeId,
          startDate: registrosFilters.startDate,
          endDate: registrosFilters.endDate
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
  }, [handleLogout, registrosFilters.employeeId, registrosFilters.startDate, registrosFilters.endDate]);

  const refreshAllData = useCallback(async () => {
    const session = getClientSession();
    if (session?.token) await loadCollections(session.token, isAdmin);
  }, [loadCollections, isAdmin]);

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
        const user = await getMe(session.token);
        if (user) {
          setProfile(user);
        }

        const ficha = await getActiveFicha(session.token);
        const extractFicha = (res) => {
          if (!res) return null;
          if (res.data !== undefined) return res.data;
          if (res.ficha) return res.ficha;
          if (res.id) return res;
          return null;
        };
        const fichaData = extractFicha(ficha);
        setActiveFicha(fichaData);
        setClockedIn(!!fichaData);
        setIsOnBreak(fichaData?.lastEvent?.type === 'BREAK_START' || (fichaData?.status === 'on_break'));

        await loadCollections(session.token);
        const dStats = await getDailyStats(session.token);
        setDailyStats(Array.isArray(dStats) ? dStats : []);
        
        const summary = await getReportSummary(session.token);
        setReportSummary(summary);

      } catch (err) {
        console.error('Init error:', err);
        if (err.status === 401) {
          handleLogout();
          return; // STOP EXECUTION
        } else {
        }
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  const handleAcceptTerms = async () => {
    setLoading(true);
    try {
      const session = getClientSession();
      await acceptTerms(session.token);
      setProfile(prev => ({ ...prev, hasAcceptedTerms: true }));
      showFeedback('success', 'Términos aceptados correctamente.');
    } catch (err) {
      showFeedback('error', 'Error al aceptar términos.');
    } finally {
      setLoading(false);
    }
  };

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
            location: {
              lat: geoLocation.latitude,
              lng: geoLocation.longitude,
            }
          };
        }
      }

      if (clockedIn) {
        await clockOut(session.token, { ...payload, authMethod: 'password' });
        // Reset total y síncrono
        setClockedIn(false);
        setIsOnBreak(false);
        setActiveFicha(null);
        showFeedback('success', 'Turno finalizado.');
      } else {
        if (workCenters && workCenters.length > 0) {
          payload.workCenterId = workCenters[0].id;
        }
        const extractFicha = (res) => {
          if (!res) return null;
          if (res.data !== undefined) return res.data;
          if (res.ficha) return res.ficha;
          if (res.id) return res;
          return null;
        };
        const res = await clockIn(session.token, { ...payload, authMethod: 'password' });
        const newFicha = extractFicha(res);
        setActiveFicha(newFicha);
        setClockedIn(!!newFicha);
        setIsOnBreak(false);
        showFeedback('success', 'Turno iniciado.');
      }
      await refreshAllData();
    } catch (err) {
      console.error('Clock toggle error:', err);
      showFeedback('error', err.message || 'Error al cambiar estado de fichaje.');
    }
  };

  const handleBreakToggle = async () => {
    const session = getClientSession();
    if (!session?.token) return;

    try {
      if (isOnBreak) {
        await breakEnd(session.token);
        setIsOnBreak(false);
        showFeedback('success', 'Pausa finalizada. Reanudando jornada.');
      } else {
        await breakStart(session.token);
        setIsOnBreak(true);
        showFeedback('success', 'Pausa iniciada.');
      }
      // Actualizar ficha activa para tener el último evento sincronizado
      const ficha = await getActiveFicha(session.token);
      const extractFicha = (res) => {
        if (!res) return null;
        if (res.data !== undefined) return res.data;
        if (res.ficha) return res.ficha;
        if (res.id) return res;
        return null;
      };
      setActiveFicha(extractFicha(ficha));
    } catch (err) {
      showFeedback('error', 'Error al cambiar estado de pausa.');
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

  const handleCorrectionSubmit = async (values) => {
    setLoading(true);
    try {
      const session = getClientSession();
      await api.post(`/api/v1/fichas/${modalData.id}/request-correction`, values, { token: session.token });
      showFeedback('success', 'Solicitud de corrección enviada al administrador.');
      await refreshAllData();
      closeModal();
    } catch (err) {
      showFeedback('error', 'Error al enviar solicitud de corrección.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewCorrection = async (decision, comment) => {
    setLoading(true);
    try {
      const session = getClientSession();
      await api.post(`/api/v1/fichas/${modalData.id}/review-correction`, { decision, comment }, { token: session.token });
      showFeedback('success', decision === 'approved' ? 'Corrección aprobada y aplicada.' : 'Corrección rechazada.');
      await refreshAllData();
      closeModal();
    } catch (err) {
      showFeedback('error', 'Error al procesar la revisión.');
    } finally {
      setLoading(false);
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
      <div className="mb-10">
        <QuickClock 
          clockedIn={clockedIn}
          isOnBreak={isOnBreak}
          onClockToggle={handleClockToggle}
          onBreakToggle={handleBreakToggle}
          elapsedTime={elapsedWorkingTime}
        />
      </div>

      <ErrorBoundary>
        <div className="flex-1">
          {activeTab === 'Inicio' && (
            <HomeHub 
              profile={profile}
              setActiveTab={setActiveTab}
              stats={{
                working: dashboardStats?.metrics?.working || 0,
                totalEmployees: employees.length,
                todayRegistros: registros.filter(r => r.startTime?.includes(new Date().toISOString().split('T')[0])).length
              }}
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
              onExport={handleExportReport}
              employees={employees}
              workCenters={workCenters}
              profile={profile}
              onEdit={(row) => {
                const isPrivileged = profile?.role === 'admin' || profile?.role === 'manager';
                if (isPrivileged) {
                  if (row.status === 'disputed') openModal('review_correction', 'edit', row);
                  else openModal('registros', 'edit', row);
                } else {
                  openModal('correction', 'edit', row);
                }
              }}
              onViewAudit={(row) => { setSelectedAuditFichaId(row.id); setAuditModalOpen(true); }}
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
              onDeleteTemplate={handleScheduleDelete}
            />
          )}

          {activeTab === 'Sedes' && (
            <SedesTab 
              workCenters={workCenters || []}
              onAdd={() => openModal('workcenter')}
              onEdit={(wc) => openModal('workcenter', 'edit', wc)}
              onDelete={handleWorkCenterDelete}
            />
          )}

          {activeTab === 'Legal' && (
            <ComplianceTab onExportInspection={handleExportReport} />
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
            <MensajesTab profile={profile} />
          )}

          {activeTab === 'Mi Perfil' && (
            <PerfilTab 
              profile={profile || {}}
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
        </div>
      </ErrorBoundary>


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
        {modal === 'correction' && (
          <CorrectionRequestForm 
            initialData={modalData}
            onSubmit={handleCorrectionSubmit}
            onCancel={closeModal}
            loading={loading}
          />
        )}
        {modal === 'review_correction' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-amber-500">Solicitud de Corrección</h4>
              <p className="text-[13px] text-zinc-300"><strong>Motivo:</strong> {modalData?.metadata?.correctionRequest?.reason}</p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] text-zinc-600 font-bold uppercase">Anterior</p>
                  <p className="text-xs text-zinc-400">{modalData?.startTime} - {modalData?.endTime}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <p className="text-[10px] text-blue-500 font-bold uppercase">Propuesto</p>
                  <p className="text-xs text-blue-400">
                    {modalData?.metadata?.correctionRequest?.proposedChanges?.startTime || modalData?.startTime} - {modalData?.metadata?.correctionRequest?.proposedChanges?.endTime || modalData?.endTime}
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
                onClick={() => handleReviewCorrection('rejected', document.getElementById('reviewComment').value)}
                className="flex-1 px-6 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all"
                disabled={loading}
              >
                Rechazar
              </button>
              <button
                onClick={() => handleReviewCorrection('approved', document.getElementById('reviewComment').value)}
                className="flex-[2] px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20"
                disabled={loading}
              >
                Aprobar y Aplicar
              </button>
            </div>
          </div>
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

      {/* MODAL DE CONSENTIMIENTO LEGAL OBLIGATORIO */}
      {profile && !profile.hasAcceptedTerms && (
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

      <AuditTrailModal 
        open={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        fichaId={selectedAuditFichaId}
      />
    </DashboardShell>
  );
}
