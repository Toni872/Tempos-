import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import UserMenu from '@/components/UserMenu';
import ModalBase from '../components/dashboard/ModalBase';
import Loader from '../components/dashboard/Loader';
import Success from '../components/dashboard/Success';
import Error from '../components/dashboard/Error';
import EmpleadoForm from '../components/dashboard/EmpleadoForm';
import DocumentoForm from '../components/dashboard/DocumentoForm';
import AusenciaForm from '../components/dashboard/AusenciaForm';
import {
  getClientSession,
  setClientSession,
  pingStatus,
  getMe,
  getDailyStats,
  listEmployees,
  createEmployee,
  updateEmployee,
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
  getReportSummary,
  listAuditLog,
  exportAuditLog,
  closeFichaPeriod,
} from '@/lib/api';

const TABS_ADMIN = ['Inicio', 'Equipo', 'Ausencias', 'Documentos', 'Informes', 'Ajustes'];
const TABS_EMPLOYEE = ['Inicio', 'Ausencias', 'Documentos', 'Informes'];

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('es-ES');
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const [isAdmin, setIsAdmin] = useState(location.state?.isAdmin ?? false);
  const [activeTab, setActiveTab] = useState('Inicio');
  const [now, setNow] = useState(new Date());
  const [clockedIn, setClockedIn] = useState(false);

  const [apiStatus, setApiStatus] = useState({ ok: false, loading: true, message: 'Conectando con API...' });
  const [profile, setProfile] = useState(null);
  const [statsError, setStatsError] = useState('');

  const [dailyStats, setDailyStats] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [auditLogRows, setAuditLogRows] = useState([]);
  const [auditFilters, setAuditFilters] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      action: '',
      userId: '',
      startDate: today,
      endDate: today,
    };
  });
  const [periodRange, setPeriodRange] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(yyyy, today.getMonth() + 1, 0).getDate();
    return {
      startDate: `${yyyy}-${mm}-01`,
      endDate: `${yyyy}-${mm}-${String(lastDay).padStart(2, '0')}`,
    };
  });

  const [modal, setModal] = useState(null);
  const [modalMode, setModalMode] = useState('add');
  const [modalData, setModalData] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const tabs = isAdmin ? TABS_ADMIN : TABS_EMPLOYEE;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const openModal = (name, mode = 'add', data = null) => {
    setModal(name);
    setModalMode(mode);
    setModalData(data);
  };

  const closeModal = () => {
    setModal(null);
    setModalData(null);
    setModalMode('add');
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setModal('feedback');
  };

  const loadAuditLog = useCallback(async (token, overrides = {}) => {
    const params = {
      ...auditFilters,
      limit: 10,
      ...overrides,
    };

    const result = await listAuditLog(token, params);
    setAuditLogRows(Array.isArray(result?.data) ? result.data : []);
  }, [auditFilters]);

  const loadCollections = useCallback(async (token) => {
    const [employeesResult, documentsResult, absencesResult, summaryResult, auditResult] = await Promise.allSettled([
      listEmployees(token),
      listDocuments(token),
      listAbsences(token),
      getReportSummary(token),
      listAuditLog(token, { limit: 10 }),
    ]);

    if (employeesResult.status === 'fulfilled') {
      setEmployees(Array.isArray(employeesResult.value?.data) ? employeesResult.value.data : []);
    }

    if (documentsResult.status === 'fulfilled') {
      setDocuments(Array.isArray(documentsResult.value?.data) ? documentsResult.value.data : []);
    }

    if (absencesResult.status === 'fulfilled') {
      setAbsences(Array.isArray(absencesResult.value?.data) ? absencesResult.value.data : []);
    }

    if (summaryResult.status === 'fulfilled') {
      setReportSummary(summaryResult.value || null);
    }

    if (auditResult.status === 'fulfilled') {
      setAuditLogRows(Array.isArray(auditResult.value?.data) ? auditResult.value.data : []);
    }
  }, []);

  useEffect(() => {
    const session = getClientSession();
    if (!session?.token) {
      navigate('/login', { replace: true });
      return;
    }

    const nextIsAdmin = location.state?.isAdmin ?? session.isAdmin ?? false;
    setIsAdmin(nextIsAdmin);

    if (session.isAdmin !== nextIsAdmin) {
      setClientSession({ ...session, isAdmin: nextIsAdmin });
    }

    const load = async () => {
      try {
        const status = await pingStatus(session.token);
        setApiStatus({
          ok: status?.database === 'connected',
          loading: false,
          message: status?.database === 'connected' ? 'API conectada' : 'API sin conexion a base de datos',
        });
      } catch {
        setApiStatus({ ok: false, loading: false, message: 'No se pudo conectar con la API.' });
      }

      try {
        setProfile(await getMe(session.token));
      } catch {
        setProfile(null);
      }

      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      try {
        const stats = await getDailyStats(session.token, firstDay.toISOString().split('T')[0], today.toISOString().split('T')[0]);
        setDailyStats(Array.isArray(stats?.data) ? stats.data : []);
        setStatsError('');
      } catch {
        setDailyStats([]);
        setStatsError('No se pudieron cargar las estadisticas de fichajes.');
      }

      await loadCollections(session.token);
    };

    load();
  }, [location.state?.isAdmin, navigate, loadCollections]);

  const handleClockToggle = async () => {
    const session = getClientSession();
    if (!session?.token) return;

    try {
      if (clockedIn) {
        await clockOut(session.token);
      } else {
        await clockIn(session.token);
      }
      setClockedIn((prev) => !prev);
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'No se pudo registrar el fichaje.');
    }
  };

  const handleEmployeeSubmit = async (values) => {
    const session = getClientSession();
    if (!session?.token) return;

    showFeedback('loading', 'Guardando empleado...');
    try {
      if (modalMode === 'edit' && modalData?.id) {
        await updateEmployee(session.token, modalData.id, values);
      } else {
        await createEmployee(session.token, values);
      }
      await loadCollections(session.token);
      closeModal();
      showFeedback('success', 'Empleado guardado correctamente.');
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'No se pudo guardar el empleado.');
    }
  };

  const handleEmployeeDelete = async (employee) => {
    const session = getClientSession();
    if (!session?.token || !employee?.id) return;

    showFeedback('loading', 'Desactivando empleado...');
    try {
      await deleteEmployee(session.token, employee.id);
      await loadCollections(session.token);
      showFeedback('success', 'Empleado desactivado.');
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'No se pudo desactivar el empleado.');
    }
  };

  const handleDocumentSubmit = async (values) => {
    const session = getClientSession();
    if (!session?.token) return;

    showFeedback('loading', 'Subiendo documento...');
    try {
      const fd = new FormData();
      fd.append('title', values.title);
      fd.append('type', values.type || 'other');
      if (values.file) fd.append('file', values.file);
      await uploadDocument(session.token, fd);
      await loadCollections(session.token);
      closeModal();
      showFeedback('success', 'Documento subido correctamente.');
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'No se pudo subir el documento.');
    }
  };

  const handleAbsenceSubmit = async (values) => {
    const session = getClientSession();
    if (!session?.token) return;

    showFeedback('loading', 'Enviando solicitud...');
    try {
      await requestAbsence(session.token, values);
      await loadCollections(session.token);
      closeModal();
      showFeedback('success', 'Solicitud enviada correctamente.');
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'No se pudo enviar la solicitud.');
    }
  };

  const actOnAbsence = async (id, action) => {
    const session = getClientSession();
    if (!session?.token) return;

    showFeedback('loading', action === 'approve' ? 'Aprobando ausencia...' : 'Rechazando ausencia...');
    try {
      if (action === 'approve') {
        await approveAbsence(session.token, id);
      } else {
        await rejectAbsence(session.token, id);
      }
      await loadCollections(session.token);
      showFeedback('success', action === 'approve' ? 'Ausencia aprobada.' : 'Ausencia rechazada.');
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'No se pudo procesar la ausencia.');
    }
  };

  const handleDownloadDocument = async (doc) => {
    const session = getClientSession();
    if (!session?.token) return;

    showFeedback('loading', 'Descargando documento...');
    try {
      const blob = await downloadDocument(session.token, doc.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename || `${doc.title || 'documento'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showFeedback('success', 'Descarga completada.');
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'No se pudo descargar el documento.');
    }
  };

  const handleSignDocument = async (doc) => {
    const session = getClientSession();
    if (!session?.token) return;

    showFeedback('loading', 'Firmando documento...');
    try {
      await signDocument(session.token, doc.id);
      await loadCollections(session.token);
      showFeedback('success', 'Documento firmado correctamente.');
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'No se pudo firmar el documento.');
    }
  };

  const handleExportReport = async () => {
    const session = getClientSession();
    if (!session?.token) return;

    showFeedback('loading', 'Exportando informe...');
    try {
      const blob = await exportReport(session.token, { format: 'pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'informe_inspeccion.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showFeedback('success', 'Informe exportado.');
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'No se pudo exportar el informe.');
    }
  };

  const handleExportAudit = async (format = 'csv') => {
    const session = getClientSession();
    if (!session?.token) return;

    showFeedback('loading', `Exportando auditoria (${format.toUpperCase()})...`);
    try {
      const blob = await exportAuditLog(session.token, { ...auditFilters, format, limit: 2000 });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'csv' ? 'auditoria_tempos.csv' : 'auditoria_tempos.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showFeedback('success', 'Auditoria exportada.');
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'No se pudo exportar la auditoria.');
    }
  };

  const handleApplyAuditFilters = async () => {
    const session = getClientSession();
    if (!session?.token) return;

    showFeedback('loading', 'Aplicando filtros de auditoria...');
    try {
      await loadAuditLog(session.token);
      showFeedback('success', 'Filtros aplicados en auditoria reciente.');
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'No se pudieron aplicar los filtros.');
    }
  };

  const handleResetAuditFilters = async () => {
    const session = getClientSession();
    if (!session?.token) return;

    const today = new Date().toISOString().slice(0, 10);
    const resetFilters = {
      action: '',
      userId: '',
      startDate: today,
      endDate: today,
    };

    setAuditFilters(resetFilters);

    showFeedback('loading', 'Restableciendo filtros...');
    try {
      await loadAuditLog(session.token, resetFilters);
      showFeedback('success', 'Filtros restablecidos.');
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'No se pudieron restablecer los filtros.');
    }
  };

  const handleClosePeriod = async () => {
    const session = getClientSession();
    if (!session?.token) return;

    if (!periodRange.startDate || !periodRange.endDate) {
      showFeedback('error', 'Debes indicar startDate y endDate para cerrar el periodo.');
      return;
    }

    showFeedback('loading', 'Cerrando periodo...');
    try {
      const result = await closeFichaPeriod(session.token, {
        startDate: periodRange.startDate,
        endDate: periodRange.endDate,
      });
      await loadCollections(session.token);
      showFeedback('success', `Periodo cerrado. Fichas archivadas: ${result?.archivedCount ?? 0}.`);
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'No se pudo cerrar el periodo.');
    }
  };

  const pendingAbsences = useMemo(
    () => absences.filter((item) => item.status === 'pending'),
    [absences]
  );

  return (
    <div className="tp-root tp-dash-shell" style={{ minHeight: '100vh', background: 'var(--bg0)', color: 'var(--t0)', display: 'flex' }}>
      <style>{`
        .tp-dash-shell {
          background:
            radial-gradient(1200px 520px at 90% -10%, rgba(37,99,235,0.12), transparent 55%),
            radial-gradient(1000px 380px at 0% 100%, rgba(16,185,129,0.08), transparent 60%),
            var(--bg0);
        }

        .tp-dash-sidebar {
          width: 240px;
          border-right: 1px solid var(--border);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: rgba(25,25,25,0.75);
          backdrop-filter: blur(10px);
        }

        .tp-dash-tabs {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tp-dash-main {
          flex: 1;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow: auto;
        }

        .tp-dash-table-wrap {
          overflow-x: auto;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: rgba(22,22,22,0.85);
        }

        .tp-dash-table-wrap table th,
        .tp-dash-table-wrap table td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--border);
          text-align: left;
          white-space: nowrap;
          font-size: 13px;
        }

        .tp-dash-table-wrap table th {
          color: var(--t2);
          font-size: 11px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          font-weight: 600;
        }

        @media (max-width: 980px) {
          .tp-dash-shell {
            flex-direction: column;
          }

          .tp-dash-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid var(--border);
            position: sticky;
            top: 0;
            z-index: 10;
          }

          .tp-dash-tabs {
            flex-direction: row;
            flex-wrap: wrap;
          }

          .tp-dash-main {
            padding: 16px;
          }

          .tp-dash-home-grid {
            grid-template-columns: 1fr !important;
          }

          .tp-dash-header {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 8px;
          }
        }
      `}</style>
      <aside className="tp-dash-sidebar">
        <div style={{ fontFamily: 'var(--ff-head)', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Tempos</div>
        <div className="tp-dash-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className="tp-btn"
              onClick={() => setActiveTab(tab)}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: 10,
                border: activeTab === tab ? '1px solid rgba(37,99,235,0.6)' : '1px solid var(--border)',
                background: activeTab === tab ? 'rgba(37,99,235,0.12)' : 'transparent',
                color: activeTab === tab ? 'var(--mg2)' : 'var(--t1)',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button className="tp-btn tp-btn-ghost" style={{ width: '100%', borderRadius: 10, padding: '10px 12px' }} onClick={logout}>
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="tp-dash-main">
        <header className="tp-dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--t2)' }}>{now.toLocaleDateString('es-ES')}</div>
            <h1 style={{ fontFamily: 'var(--ff-head)', fontSize: 28, margin: 0 }}>{activeTab}</h1>
          </div>
          <UserMenu />
        </header>

        <div style={{ borderRadius: 10, border: apiStatus.ok ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(239,68,68,0.35)', background: apiStatus.ok ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', padding: '10px 12px', fontSize: 13, color: apiStatus.ok ? '#86efac' : '#fecaca', fontWeight: 600 }}>
          {apiStatus.loading ? 'Conectando con API...' : apiStatus.message}
          {statsError ? ` · ${statsError}` : ''}
        </div>

        {activeTab === 'Inicio' && (
          <section className="tp-dash-home-grid" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
            <article className="tp-card" style={{ padding: 18, borderRadius: 12 }}>
              <div style={{ color: 'var(--t2)', fontSize: 13 }}>Usuario</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{profile?.displayName || profile?.email || 'Sin perfil'}</div>
            </article>
            <article className="tp-card" style={{ padding: 18, borderRadius: 12 }}>
              <div style={{ color: 'var(--t2)', fontSize: 13 }}>Fichajes del mes</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{dailyStats.length}</div>
            </article>
            <article className="tp-card" style={{ padding: 18, borderRadius: 12 }}>
              <div style={{ color: 'var(--t2)', fontSize: 13 }}>Jornada</div>
              <button className="tp-btn tp-btn-primary" style={{ marginTop: 8, borderRadius: 10, padding: '10px 14px' }} onClick={handleClockToggle}>
                {clockedIn ? 'Finalizar turno' : 'Marcar entrada'}
              </button>
            </article>
          </section>
        )}

        {activeTab === 'Equipo' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <h2 style={{ margin: 0 }}>Equipo</h2>
              <button className="tp-btn tp-btn-primary" style={{ borderRadius: 10, padding: '8px 12px' }} onClick={() => openModal('empleado')}>+ Empleado</button>
            </div>
            <div className="tp-dash-table-wrap">
              <table className="tp-dash-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e) => (
                    <tr key={e.id}>
                      <td>{e.name || e.email}</td>
                      <td>{e.email}</td>
                      <td>{e.role}</td>
                      <td>{e.status}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="tp-btn tp-btn-ghost" style={{ borderRadius: 8, padding: '6px 10px', marginRight: 6 }} onClick={() => openModal('empleado', 'edit', e)}>Editar</button>
                        {isAdmin && (
                          <button className="tp-btn" style={{ borderRadius: 8, padding: '6px 10px', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.35)', background: 'transparent' }} onClick={() => handleEmployeeDelete(e)}>
                            Desactivar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr><td colSpan={5}>No hay empleados para mostrar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'Ausencias' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <h2 style={{ margin: 0 }}>Ausencias</h2>
              <button className="tp-btn tp-btn-primary" style={{ borderRadius: 10, padding: '8px 12px' }} onClick={() => openModal('ausencia')}>Solicitar</button>
            </div>
            {pendingAbsences.length === 0 && <div style={{ color: 'var(--t1)' }}>No hay ausencias pendientes.</div>}
            {pendingAbsences.map((a) => (
              <div key={a.id} className="tp-card" style={{ borderRadius: 12, padding: 14, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{a.type}</div>
                  <div style={{ color: 'var(--t1)', fontSize: 13 }}>{formatDate(a.startDate)} - {formatDate(a.endDate)}</div>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="tp-btn tp-btn-ghost" style={{ borderRadius: 8, padding: '6px 10px' }} onClick={() => actOnAbsence(a.id, 'reject')}>Rechazar</button>
                    <button className="tp-btn tp-btn-primary" style={{ borderRadius: 8, padding: '6px 10px' }} onClick={() => actOnAbsence(a.id, 'approve')}>Aprobar</button>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {activeTab === 'Documentos' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <h2 style={{ margin: 0 }}>Documentos</h2>
              {isAdmin && <button className="tp-btn tp-btn-primary" style={{ borderRadius: 10, padding: '8px 12px' }} onClick={() => openModal('documento')}>+ Documento</button>}
            </div>
            <div className="tp-dash-table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Titulo</th><th>Tipo</th><th>Estado</th><th>Fecha</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d) => (
                    <tr key={d.id}>
                      <td>{d.title || d.filename || 'Documento'}</td>
                      <td>{d.type || 'other'}</td>
                      <td>{d.status}</td>
                      <td>{formatDate(d.createdAt)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="tp-btn tp-btn-ghost" style={{ borderRadius: 8, padding: '6px 10px', marginRight: 6 }} onClick={() => handleDownloadDocument(d)}>Descargar</button>
                        {d.status !== 'signed' && <button className="tp-btn tp-btn-primary" style={{ borderRadius: 8, padding: '6px 10px' }} onClick={() => handleSignDocument(d)}>Firmar</button>}
                      </td>
                    </tr>
                  ))}
                  {documents.length === 0 && (
                    <tr><td colSpan={5}>No hay documentos.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'Informes' && (
          <section className="tp-card" style={{ borderRadius: 12, padding: 16 }}>
            <h2 style={{ marginTop: 0 }}>Informes</h2>
            <p style={{ color: 'var(--t1)' }}>Entradas confirmadas: {reportSummary?.totalEntries ?? 0}</p>
            <p style={{ color: 'var(--t1)' }}>Horas totales: {reportSummary?.totalHours ?? 0}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <button className="tp-btn tp-btn-primary" style={{ borderRadius: 10, padding: '8px 12px' }} onClick={handleExportReport}>Exportar fichajes PDF</button>
              <button className="tp-btn tp-btn-ghost" style={{ borderRadius: 10, padding: '8px 12px' }} onClick={() => handleExportAudit('csv')}>Exportar auditoria CSV</button>
              <button className="tp-btn tp-btn-ghost" style={{ borderRadius: 10, padding: '8px 12px' }} onClick={() => handleExportAudit('pdf')}>Exportar auditoria PDF</button>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
              <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>Auditoria reciente</h3>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 10 }}>
                <label style={{ display: 'grid', gap: 4, fontSize: 12, color: 'var(--t2)' }}>
                  Accion
                  <select
                    value={auditFilters.action}
                    onChange={(e) => setAuditFilters((prev) => ({ ...prev, action: e.target.value }))}
                    style={{ borderRadius: 8, border: '1px solid var(--border)', padding: '8px 10px', background: 'var(--bg2)', color: 'var(--t0)' }}
                  >
                    <option value="">Todas</option>
                    <option value="clock_in">clock_in</option>
                    <option value="clock_out">clock_out</option>
                    <option value="ficha_correction_requested">ficha_correction_requested</option>
                    <option value="ficha_correction_reviewed">ficha_correction_reviewed</option>
                    <option value="ficha_period_closed">ficha_period_closed</option>
                    <option value="report_export">report_export</option>
                    <option value="report_audit_export">report_audit_export</option>
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 4, fontSize: 12, color: 'var(--t2)' }}>
                  Usuario
                  <input
                    type="text"
                    value={auditFilters.userId}
                    onChange={(e) => setAuditFilters((prev) => ({ ...prev, userId: e.target.value }))}
                    placeholder="uid (opcional)"
                    style={{ borderRadius: 8, border: '1px solid var(--border)', padding: '8px 10px', background: 'var(--bg2)', color: 'var(--t0)' }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 4, fontSize: 12, color: 'var(--t2)' }}>
                  Desde
                  <input
                    type="date"
                    value={auditFilters.startDate}
                    onChange={(e) => setAuditFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                    style={{ borderRadius: 8, border: '1px solid var(--border)', padding: '8px 10px', background: 'var(--bg2)', color: 'var(--t0)' }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 4, fontSize: 12, color: 'var(--t2)' }}>
                  Hasta
                  <input
                    type="date"
                    value={auditFilters.endDate}
                    onChange={(e) => setAuditFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                    style={{ borderRadius: 8, border: '1px solid var(--border)', padding: '8px 10px', background: 'var(--bg2)', color: 'var(--t0)' }}
                  />
                </label>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                <button className="tp-btn tp-btn-primary" style={{ borderRadius: 10, padding: '8px 12px' }} onClick={handleApplyAuditFilters}>
                  Aplicar filtros
                </button>
                <button className="tp-btn tp-btn-ghost" style={{ borderRadius: 10, padding: '8px 12px' }} onClick={handleResetAuditFilters}>
                  Restablecer
                </button>
              </div>
              {auditLogRows.length === 0 ? (
                <p style={{ color: 'var(--t2)', margin: 0 }}>Sin eventos recientes.</p>
              ) : (
                <div className="tp-dash-table-wrap">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Accion</th>
                        <th>Usuario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogRows.map((row) => (
                        <tr key={row.id}>
                          <td>{formatDate(row.createdAt)}</td>
                          <td>{row.action}</td>
                          <td>{row.userId || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {isAdmin && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
                <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>Cierre de periodo</h3>
                <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 10 }}>
                  <label style={{ display: 'grid', gap: 4, fontSize: 12, color: 'var(--t2)' }}>
                    Inicio
                    <input
                      type="date"
                      value={periodRange.startDate}
                      onChange={(e) => setPeriodRange((prev) => ({ ...prev, startDate: e.target.value }))}
                      style={{ borderRadius: 8, border: '1px solid var(--border)', padding: '8px 10px', background: 'var(--bg2)', color: 'var(--t0)' }}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: 4, fontSize: 12, color: 'var(--t2)' }}>
                    Fin
                    <input
                      type="date"
                      value={periodRange.endDate}
                      onChange={(e) => setPeriodRange((prev) => ({ ...prev, endDate: e.target.value }))}
                      style={{ borderRadius: 8, border: '1px solid var(--border)', padding: '8px 10px', background: 'var(--bg2)', color: 'var(--t0)' }}
                    />
                  </label>
                </div>
                <button className="tp-btn" style={{ borderRadius: 10, padding: '8px 12px', border: '1px solid rgba(245,158,11,0.45)', color: '#fbbf24', background: 'rgba(245,158,11,0.08)' }} onClick={handleClosePeriod}>
                  Cerrar periodo
                </button>
              </div>
            )}
          </section>
        )}

        {activeTab === 'Ajustes' && (
          <section className="tp-card" style={{ borderRadius: 12, padding: 16 }}>
            <h2 style={{ marginTop: 0 }}>Ajustes</h2>
            <button className="tp-btn tp-btn-ghost" style={{ borderRadius: 10, padding: '8px 12px' }} onClick={() => navigate('/kiosk')}>Ir a Kiosko</button>
          </section>
        )}
      </main>

      <ModalBase open={modal === 'empleado'} onClose={closeModal} title={modalMode === 'edit' ? 'Editar empleado' : 'Nuevo empleado'}>
        <EmpleadoForm initialValues={modalData || {}} onSubmit={handleEmployeeSubmit} onCancel={closeModal} />
      </ModalBase>

      <ModalBase open={modal === 'documento'} onClose={closeModal} title={'Subir documento'}>
        <DocumentoForm initialValues={modalData || {}} onSubmit={handleDocumentSubmit} onCancel={closeModal} />
      </ModalBase>

      <ModalBase open={modal === 'ausencia'} onClose={closeModal} title={'Solicitar ausencia'}>
        <AusenciaForm initialValues={modalData || {}} onSubmit={handleAbsenceSubmit} onCancel={closeModal} />
      </ModalBase>

      <ModalBase open={modal === 'feedback'} onClose={() => setModal(null)} title={feedback.type === 'error' ? 'Error' : feedback.type === 'success' ? 'Exito' : ''}>
        {feedback.type === 'loading' && <Loader text={feedback.message} />}
        {feedback.type === 'success' && <Success text={feedback.message} />}
        {feedback.type === 'error' && <Error text={feedback.message} />}
      </ModalBase>
    </div>
  );
}
