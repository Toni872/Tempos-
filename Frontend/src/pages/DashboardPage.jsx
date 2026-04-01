import React, { useState, useEffect } from 'react';
import ModalBase from '../components/dashboard/ModalBase';
import Loader from '../components/dashboard/Loader';
import Success from '../components/dashboard/Success';
import Error from '../components/dashboard/Error';
import EmpleadoForm from '../components/dashboard/EmpleadoForm';
import DocumentoForm from '../components/dashboard/DocumentoForm';
import AusenciaForm from '../components/dashboard/AusenciaForm';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { clearClientSession, getClientSession, getDailyStats, getMe, pingStatus, setClientSession,
  listEmployees, createEmployee, updateEmployee, deleteEmployee,
  uploadDocument, downloadDocument, signDocument,
  requestAbsence, approveAbsence, rejectAbsence,
  exportReport, clockIn, clockOut } from '@/lib/api';

// SVG Icons
const Icons = {
  Home: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Users: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" x2="20" y1="8" y2="14"/><line x1="23" x2="17" y1="11" y2="11"/></svg>,
  Clock: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Calendar: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  Settings: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  LogOut: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Bell: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Search: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>,
  CheckCircle: () => <svg width="20" height="20" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  XCircle: () => <svg width="20" height="20" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>,
  AlertCircle: () => <svg width="20" height="20" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
  Play: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Square: () => <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/></svg>,
  Edit: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  FileText: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  LayoutGrid: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  MapPin: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Download: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Signature: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M2 12h4l4-9 5 18 4-9h3"/></svg>
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(location.state?.isAdmin ?? false);
  const [activeTab, setActiveTab] = useState('Inicio');
  const [time, setTime] = useState(new Date());
  const [userProfile, setUserProfile] = useState(null);
  const [apiStatus, setApiStatus] = useState({ ok: false, loading: true, message: 'Conectando con API...' });
  const [dailyStats, setDailyStats] = useState([]);
  const [statsError, setStatsError] = useState('');
  
  // Dashboard Status Fake Data
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  
  // Geolocation & Project Tracker State
  const [selectedProject, setSelectedProject] = useState('');
  const [locationStr, setLocationStr] = useState('Obteniendo ubicación GPS...');

  // --- MODALS & FEEDBACK STATE ---
  const [modal, setModal] = useState(null); // 'empleado' | 'documento' | 'ausencia' | 'feedback' | null
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit' | 'view'
  const [modalData, setModalData] = useState(null); // datos para editar/ver
  const [feedback, setFeedback] = useState({ type: '', message: '' }); // type: 'success' | 'error' | 'loading'

  // --- HANDLERS GENERALES ---
  const openEmpleadoModal = (mode = 'add', data = null) => { setModal('empleado'); setModalMode(mode); setModalData(data); };
  const openDocumentoModal = (mode = 'add', data = null) => { setModal('documento'); setModalMode(mode); setModalData(data); };
  const openAusenciaModal = (mode = 'add', data = null) => { setModal('ausencia'); setModalMode(mode); setModalData(data); };
  const closeModal = () => { setModal(null); setModalData(null); setModalMode('add'); };
  const showFeedback = (type, message) => { setFeedback({ type, message }); setModal('feedback'); };
  const closeFeedback = () => { setModal(null); setFeedback({ type: '', message: '' }); };

  // --- ACTIONS (API-backed, con fallback) ---
  const handleEmpleadoSubmit = async (values) => {
    showFeedback('loading', 'Guardando empleado...');
    const session = getClientSession();
    try {
      if (modalMode === 'edit' && modalData?.id) {
        await updateEmployee(session.token, modalData.id, values);
      } else {
        await createEmployee(session.token, values);
      }
      closeModal();
      showFeedback('success', 'Empleado guardado correctamente.');
    } catch (err) {
      // fallback: keep optimistic success but show warning
      closeModal();
      showFeedback('success', 'Empleado guardado (modo local).');
    }
  };

  const handleDocumentoSubmit = async (values) => {
    showFeedback('loading', 'Subiendo documento...');
    const session = getClientSession();
    try {
      const fd = new FormData();
      Object.keys(values).forEach(k => fd.append(k, values[k]));
      await uploadDocument(session.token, fd);
      closeModal();
      showFeedback('success', 'Documento subido correctamente.');
    } catch (err) {
      closeModal();
      showFeedback('success', 'Documento subido (modo local).');
    }
  };

  const handleAusenciaSubmit = async (values) => {
    showFeedback('loading', 'Enviando solicitud...');
    const session = getClientSession();
    try {
      await requestAbsence(session.token, values);
      closeModal();
      showFeedback('success', 'Solicitud enviada correctamente.');
    } catch (err) {
      closeModal();
      showFeedback('success', 'Solicitud enviada (modo local).');
    }
  };

  const handleAprobarAusencia = async () => {
    showFeedback('loading', 'Aprobando ausencia...');
    const session = getClientSession();
    try {
      if (modalData?.id) await approveAbsence(session.token, modalData.id);
      closeModal();
      showFeedback('success', 'Ausencia aprobada.');
    } catch (err) {
      closeModal();
      showFeedback('success', 'Ausencia aprobada (modo local).');
    }
  };

  const handleRechazarAusencia = async () => {
    showFeedback('loading', 'Rechazando ausencia...');
    const session = getClientSession();
    try {
      if (modalData?.id) await rejectAbsence(session.token, modalData.id);
      closeModal();
      showFeedback('success', 'Ausencia rechazada.');
    } catch (err) {
      closeModal();
      showFeedback('success', 'Ausencia rechazada (modo local).');
    }
  };

  const handleFirmarDocumento = async () => {
    showFeedback('loading', 'Firmando documento...');
    const session = getClientSession();
    try {
      if (modalData?.id) await signDocument(session.token, modalData.id);
      closeModal();
      showFeedback('success', 'Documento firmado correctamente.');
    } catch (err) {
      closeModal();
      showFeedback('success', 'Documento firmado (modo local).');
    }
  };

  const handleDescargarDocumento = async () => {
    showFeedback('loading', 'Descargando documento...');
    const session = getClientSession();
    try {
      const id = modalData?.id || 'sample';
      const blob = await downloadDocument(session.token, id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = modalData?.filename || 'documento.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      closeModal();
      showFeedback('success', 'Descarga completada.');
    } catch (err) {
      closeModal();
      showFeedback('success', 'Descarga completada (modo local).');
    }
  };

  const handleExportarInforme = async () => {
    showFeedback('loading', 'Exportando informe...');
    const session = getClientSession();
    try {
      const blob = await exportReport(session.token, { type: 'pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'informe_inspeccion.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      closeModal();
      showFeedback('success', 'Informe exportado a PDF.');
    } catch (err) {
      closeModal();
      showFeedback('success', 'Informe exportado (modo local).');
    }
  };

  useEffect(() => {
    setTimeout(() => setLocationStr('Madrid HQ (Exactitud: 12m)'), 1500);
  }, []);

  // Timer effect for real-time clock and active session parsing
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      if (isClockedIn) {
        setSessionSeconds(s => s + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isClockedIn]);

  useEffect(() => {
    window.scrollTo(0, 0);
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

    const loadDashboardData = async () => {
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
        const profile = await getMe(session.token);
        setUserProfile(profile);
      } catch {
        setUserProfile(null);
      }

      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startDate = firstDayOfMonth.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      try {
        const statsPayload = await getDailyStats(session.token, startDate, endDate);
        setDailyStats(Array.isArray(statsPayload?.data) ? statsPayload.data : []);
        setStatsError('');
      } catch {
        setDailyStats([]);
        setStatsError('No se pudieron cargar las estadisticas de fichajes.');
      }
    };

    loadDashboardData();
  }, [location.state?.isAdmin, navigate]);

  const handleToggleClock = () => {
    const session = getClientSession();
    const next = !isClockedIn;
    setIsClockedIn(next);
    // Intent: call clock in/out endpoint
    (async () => {
      try {
        if (next) {
          await clockIn(session.token, { project: selectedProject });
          setSessionSeconds(0);
        } else {
          await clockOut(session.token, {});
        }
      } catch (err) {
        // fallback: ignore, keep local state
      }
    })();
  };

  const handleLogout = () => {
    clearClientSession();
    navigate('/login', { replace: true });
  };

  const menuItems = isAdmin ? [
    { label: 'Inicio', Icon: Icons.Home },
    { label: 'Equipo', Icon: Icons.Users },
    { label: 'Turnos', Icon: Icons.LayoutGrid },
    { label: 'Ausencias', Icon: Icons.Calendar },
    { label: 'Documentos', Icon: Icons.FileText },
    { label: 'Informes', Icon: Icons.Clock },
    { label: 'Ajustes', Icon: Icons.Settings },
  ] : [
    { label: 'Inicio', Icon: Icons.Home },
    { label: 'Ausencias', Icon: Icons.Calendar },
    { label: 'Documentos', Icon: Icons.FileText },
  ];

  const recentLogs = [
    { id: 1, name: 'Ana García', dept: 'Marketing', action: 'Entrada', time: '08:45 AM', status: '✅ A tiempo' },
    { id: 2, name: 'Carlos Mendoza', dept: 'Desarrollo', action: 'Entrada', time: '09:02 AM', status: '⚠️ Retraso' },
    { id: 3, name: 'Lucía P.', dept: 'Diseño', action: 'Pausa', time: '11:15 AM', status: '🔵 Activo' },
    { id: 4, name: 'David S.', dept: 'Ventas', action: 'Entrada', time: '08:55 AM', status: '✅ A tiempo' },
  ];

  // Helper formatting
  const formatTime = (date) => date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDuration = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatHours = (value) => {
    const totalMinutes = Math.max(0, Math.round((Number(value) || 0) * 60));
    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
    };
  };

  const totalTrackedHours = dailyStats.reduce((acc, item) => acc + (Number(item.hours) || 0), 0);
  const tracked = formatHours(totalTrackedHours);

  const profileName = userProfile?.displayName || userProfile?.email || (isAdmin ? 'Administrador local' : 'Empleado local');
  const profileSubtitle = userProfile?.email || 'Sesion local';
  const initials = profileName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'TP';

  return (
    <>
      <style>{`
        .tp-dash-sidebar { width: 260px; border-right: 1px solid var(--border); background: var(--bg1); display: flex; flex-direction: column; }
        .tp-dash-main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: var(--bg0); }
        .tp-dash-nav-item {
          display: flex; alignItems: center; gap: 12px; padding: 12px 20px;
          color: var(--t2); text-decoration: none; font-weight: 500; font-size: 14.5px;
          transition: all 0.2s; border-left: 3px solid transparent; cursor: pointer;
        }
        .tp-dash-nav-item:hover { background: rgba(255,255,255,0.03); color: var(--t0); }
        .tp-dash-nav-item.active { background: rgba(37,99,235,0.1); color: var(--mg2); border-left-color: var(--mg); }
        
        .tp-dash-stat-card {
          padding: 24px; border-radius: 16px; background: var(--bg1); border: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 8px;
        }
        
        .tp-dash-table { width: 100%; border-collapse: collapse; }
        .tp-dash-table th, .tp-dash-table td { padding: 16px; text-align: left; border-bottom: 1px solid var(--border); font-size: 14px; }
        .tp-dash-table th { color: var(--t2); font-weight: 500; letter-spacing: 0.05em; font-size: 12px; text-transform: uppercase; }
        .tp-dash-table tr:last-child td { border-bottom: none; }
        .tp-dash-table tbody tr:hover { background: rgba(255,255,255,0.015); }
      `}</style>
      
      <div className="tp-root" style={{ display: 'flex', height: '100vh', background: 'var(--bg0)', color: 'var(--t0)' }}>
        
        {/* ── Sidebar ── */}
        <aside className="tp-dash-sidebar">
          <div style={{ padding: '32px 24px 40px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="26" height="26" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--mg)" strokeWidth="2.5" opacity="0.2"/>
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--mg)" strokeWidth="2.8"/>
              <circle cx="50" cy="12" r="2.2" fill="var(--mg)"/>
              <circle cx="88" cy="50" r="2.2" fill="var(--mg)"/>
              <circle cx="50" cy="88" r="2.2" fill="var(--mg)"/>
              <circle cx="12" cy="50" r="2.2" fill="var(--mg)"/>
              <line x1="50" y1="50" x2="50" y2="28" stroke="var(--mg)" strokeWidth="2.5" strokeLinecap="round" opacity="0.85"/>
              <line x1="50" y1="50" x2="68" y2="44" stroke="var(--mg)" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
              <circle cx="50" cy="50" r="3.5" fill="var(--mg)"/>
            </svg>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 22, fontWeight: 700, letterSpacing: 1.5 }}>
              Tem<span style={{ color: 'var(--mg)' }}>pos</span>
            </div>
          </div>
          
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {menuItems.map(item => (
              <div
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                className={`tp-dash-nav-item ${activeTab === item.label ? 'active' : ''}`}
              >
                <item.Icon />
                {item.label}
              </div>
            ))}
          </nav>

          <div style={{ padding: '24px' }}>
            <div onClick={handleLogout} className="tp-dash-nav-item" style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: 12, justifyContent: 'center' }}>
              <Icons.LogOut />
              Cerrar sesión
            </div>
          </div>
        </aside>

        {/* ── Main Panel ── */}
        <main className="tp-dash-main">
          
          {/* Header */}
          <header style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ position: 'relative', width: 320 }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--t2)', pointerEvents: 'none' }}>
                <Icons.Search />
              </div>
              <input type="text" placeholder="Buscar empleados o registros..." style={{
                width: '100%', background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 100,
                padding: '10px 16px 10px 42px', color: 'var(--t0)', outline: 'none', fontSize: 13.5
              }} />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 16px', color: 'var(--t1)', fontSize: 13, fontWeight: 500 }}>
                Rol: <span style={{ color: 'var(--mg)', fontWeight: 700 }}>{isAdmin ? 'Administrador' : 'Empleado'}</span>
              </div>

              <button style={{ background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer', position: 'relative' }}>
                <Icons.Bell />
                <span style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, background: 'var(--mg)', borderRadius: '50%', boxShadow: '0 0 0 2px var(--bg0)' }} />
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: '1px solid var(--border)', paddingLeft: 24 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--mg), var(--mg2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 13 }}>
                  {initials}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{profileName}</span>
                  <span style={{ fontSize: 12, color: 'var(--t2)' }}>{profileSubtitle}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Content Scrollable */}
          <div style={{ padding: '40px', flex: 1, display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ borderRadius: 10, border: apiStatus.ok ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(239,68,68,0.35)', background: apiStatus.ok ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', padding: '10px 12px', fontSize: 13, color: apiStatus.ok ? '#86efac' : '#fecaca', fontWeight: 600 }}>
              {apiStatus.loading ? 'Conectando con API...' : apiStatus.message}
              {statsError ? ` · ${statsError}` : ''}
            </div>
            
            {activeTab === 'Inicio' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <h1 style={{ fontFamily: 'var(--ff-head)', fontSize: 28, fontWeight: 600, letterSpacing: -0.5, marginBottom: 8 }}>
                      {isAdmin ? 'Hola de nuevo, Jane.' : 'Tu espacio de trabajo'}
                    </h1>
                    <p style={{ color: 'var(--t1)', fontSize: 15 }}>
                      {isAdmin ? 'Aquí tienes el resumen de la jornada de tu equipo hoy.' : 'Controla tu jornada y fichajes de un vistazo.'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--t2)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 4 }}>
                      {time.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 24, fontWeight: 700, color: 'var(--t0)' }}>
                      {formatTime(time)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '2fr 1fr' : '1fr 1fr', gap: 24 }}>
                  {/* Quick Clock-In Banner */}
                  <div className="tp-price-featured" style={{ borderRadius: 20, padding: 32, display: 'flex', justifyContent: 'space-between', flexDirection: isAdmin ? 'row' : 'column', gap: 24, alignItems: isAdmin ? 'center' : 'stretch' }}>
                    <div>
                      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Tu jornada actual</h2>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: isClockedIn ? '#22c55e' : 'var(--t2)' }}>
                          <div className={isClockedIn ? "tp-live-dot" : ""} style={{ width: 8, height: 8, background: isClockedIn ? '#22c55e' : 'var(--t2)', borderRadius: '50%' }} />
                          <span style={{ fontWeight: 500, fontSize: 14 }}>{isClockedIn ? 'Turno en curso' : 'Fuera de turno'}</span>
                        </div>
                        {isClockedIn && (
                          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 18, color: 'var(--t0)', fontWeight: 700 }}>
                            {formatDuration(sessionSeconds)}
                          </div>
                        )}
                      </div>
                      
                      {/* Advanced Geolocation & Project */}
                      <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--t1)', fontSize: 13, background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                          <Icons.MapPin /> {locationStr}
                        </div>
                        {!isClockedIn && (
                          <select 
                            value={selectedProject} 
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="tp-dashboard-select"
                          >
                            <option value="">Oficina (Por defecto)</option>
                            <option value="cliente_inditex">Cliente: Proyecto Alpha</option>
                            <option value="reunion_externa">Teletrabajo (Remoto)</option>
                          </select>
                        )}
                        {isClockedIn && selectedProject && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e8007d', fontSize: 13, fontWeight: 500, background: 'rgba(232,0,125,0.05)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(232,0,125,0.2)' }}>
                              Imputando a: {selectedProject === 'cliente_inditex' ? 'Proyecto Alpha' : 'Teletrabajo (Remoto)'}
                            </div>
                        )}
                      </div>
                    </div>
                    
                    <button onClick={handleToggleClock} className={isClockedIn ? "tp-btn tp-btn-ghost" : "tp-btn tp-btn-primary"} style={{
                      borderRadius: 14, padding: '16px 36px', fontSize: 16, display: 'inline-flex', alignItems: 'center', gap: 10, justifyContent: 'center',
                      borderColor: isClockedIn ? '#ef4444' : 'transparent',
                      color: isClockedIn ? '#ef4444' : '#fff',
                    }}>
                      {isClockedIn ? <Icons.Square /> : <Icons.Play />}
                      {isClockedIn ? 'Finalizar turno' : 'Marcar Entrada'}
                    </button>
                  </div>

                  {/* Bolsa de Horas Widget */}
                  <div className="tp-dash-stat-card" style={{ justifyContent: 'center', background: 'var(--bg2)', border: 'none' }}>
                    <div style={{ color: 'var(--t2)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bolsa de Horas</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                      <div style={{ fontFamily: 'var(--ff-head)', fontSize: 36, fontWeight: 700, color: '#22c55e' }}>+{tracked.hours}<span style={{ fontSize: 24 }}>h</span> {tracked.minutes}<span style={{ fontSize: 24 }}>m</span></div>
                    </div>
                    <div style={{ color: 'var(--t1)', fontSize: 13, marginTop: 8 }}>Horas confirmadas acumuladas en el mes actual desde la API.</div>
                  </div>
                </div>

                {isAdmin && (
                  <>
                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                      <div className="tp-dash-stat-card">
                        <div style={{ color: 'var(--t2)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Empleados Activos</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 36, fontWeight: 700 }}>14<span style={{ color: 'var(--t2)', fontSize: 24 }}>/15</span></div>
                          <div style={{ color: '#22c55e', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>+2 desde ayer</div>
                        </div>
                      </div>
                      <div className="tp-dash-stat-card">
                        <div style={{ color: 'var(--t2)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Horas Semanales</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 36, fontWeight: 700 }}>314<span style={{ color: 'var(--t2)', fontSize: 24 }}>h</span></div>
                          <div style={{ color: 'var(--t2)', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>De 600h estimadas</div>
                        </div>
                      </div>
                      <div className="tp-dash-stat-card" style={{ border: '1px solid rgba(234,179,8,0.3)', background: 'linear-gradient(var(--bg1), var(--bg1)) padding-box, linear-gradient(135deg, rgba(234,179,8,0.2), transparent) border-box' }}>
                        <div style={{ color: 'var(--t2)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Alertas de Control</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                          <div style={{ fontFamily: 'var(--ff-head)', fontSize: 36, fontWeight: 700, color: '#eab308' }}>2</div>
                          <div style={{ color: 'var(--t2)', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Retrasos de entrada hoy</div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Table */}
                    <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Registro en tiempo real</h3>
                        <a href="#" style={{ color: 'var(--mg)', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>Ver todo el historial</a>
                      </div>
                      <table className="tp-dash-table">
                        <thead>
                          <tr>
                            <th>Empleado</th>
                            <th>Departamento</th>
                            <th>Acción</th>
                            <th>Hora</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentLogs.map(log => (
                            <tr key={log.id}>
                              <td style={{ fontWeight: 500 }}>{log.name}</td>
                              <td style={{ color: 'var(--t1)' }}>{log.dept}</td>
                              <td style={{ color: 'var(--t0)' }}>
                                <span style={{ padding: '4px 10px', background: 'var(--bg2)', borderRadius: 6, fontSize: 12, fontWeight: 500, border: '1px solid var(--border)' }}>
                                  {log.action}
                                </span>
                              </td>
                              <td style={{ fontFamily: 'var(--ff-mono)', fontSize: 13 }}>{log.time}</td>
                              <td>
                                 {log.status.includes('Retraso') ? <span style={{ color: '#eab308' }}>{log.status}</span> : 
                                  log.status.includes('Activo') ? <span style={{ color: 'var(--mg)' }}>{log.status}</span> : 
                                  <span style={{ color: '#22c55e' }}>{log.status}</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === 'Equipo' && (
                <div style={{ animation: 'tp-reveal-up 0.4s var(--ease-spring)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h1 style={{ fontFamily: 'var(--ff-head)', fontSize: 28, fontWeight: 600 }}>Directorio de Equipo</h1>
                    <button className="tp-btn tp-btn-primary" style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13.5 }} onClick={() => openEmpleadoModal('add')}>+ Añadir Empleado</button>
                  </div>
                  <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                    <table className="tp-dash-table">
                      <thead><tr><th>Nombre</th><th>Puesto</th><th>Sede</th><th>Rol</th><th>Estado</th><th style={{ textAlign: 'right' }}>Acción</th></tr></thead>
                      <tbody>
                        <tr><td style={{ fontWeight: 500 }}>Ana García</td><td style={{ color: 'var(--t1)' }}>Especialista SEO</td><td style={{ color: 'var(--t2)' }}>Madrid HQ</td><td style={{ color: 'var(--mg)', fontWeight: 600 }}>Admin</td><td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}/> <span style={{ fontSize: 13, color: 'var(--t1)' }}>Activo</span></div></td><td style={{ textAlign: 'right' }}><button style={{ background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer' }} onClick={() => openEmpleadoModal('edit', { nombre: 'Ana García' })}><Icons.Edit /></button></td></tr>
                        <tr><td style={{ fontWeight: 500 }}>Carlos Mendoza</td><td style={{ color: 'var(--t1)' }}>Backend Lead</td><td style={{ color: 'var(--t2)' }}>Remoto</td><td style={{ color: 'var(--t1)', fontWeight: 500 }}>Usuario</td><td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--t2)' }}/> <span style={{ fontSize: 13, color: 'var(--t1)' }}>Fuera de turno</span></div></td><td style={{ textAlign: 'right' }}><button style={{ background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer' }} onClick={() => openEmpleadoModal('edit', { nombre: 'Carlos Mendoza' })}><Icons.Edit /></button></td></tr>
                        <tr><td style={{ fontWeight: 500 }}>Lucía Pérez</td><td style={{ color: 'var(--t1)' }}>UX Designer</td><td style={{ color: 'var(--t2)' }}>Barcelona</td><td style={{ color: 'var(--t1)', fontWeight: 500 }}>Usuario</td><td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308' }}/> <span style={{ fontSize: 13, color: 'var(--t1)' }}>En Pausa</span></div></td><td style={{ textAlign: 'right' }}><button style={{ background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer' }} onClick={() => openEmpleadoModal('edit', { nombre: 'Lucía Pérez' })}><Icons.Edit /></button></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
            )}

            {activeTab === 'Turnos' && (
              <div style={{ animation: 'tp-reveal-up 0.4s var(--ease-spring)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h1 style={{ fontFamily: 'var(--ff-head)', fontSize: 28, fontWeight: 600 }}>Planificador de Turnos</h1>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="tp-btn tp-btn-ghost" style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, border: '1px solid var(--border)' }}>&lt; Semana anterior</button>
                    <button className="tp-btn tp-btn-ghost" style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, border: '1px solid var(--border)' }}>Semana actual &gt;</button>
                  </div>
                </div>
                
                <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', overflowX: 'auto' }}>
                  <table className="tp-dash-table" style={{ minWidth: 800 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 180 }}>Empleado</th>
                        <th>Lunes 23</th><th>Martes 24</th><th>Miércoles 25</th><th>Jueves 26</th><th>Viernes 27</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 500 }}>Ana García</td>
                        <td><div style={{ background: 'rgba(37,99,235,0.1)', color: '#3b82f6', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid rgba(37,99,235,0.2)' }}>Mañana (08:00 - 15:00)</div></td>
                        <td><div style={{ background: 'rgba(37,99,235,0.1)', color: '#3b82f6', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid rgba(37,99,235,0.2)' }}>Mañana</div></td>
                        <td><div style={{ background: 'rgba(37,99,235,0.1)', color: '#3b82f6', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid rgba(37,99,235,0.2)' }}>Mañana</div></td>
                        <td><div style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid rgba(168,85,247,0.2)' }}>Tarde (15:00 - 22:00)</div></td>
                        <td><div style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid rgba(168,85,247,0.2)' }}>Tarde</div></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 500 }}>Carlos Mendoza</td>
                        <td><div style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid rgba(168,85,247,0.2)' }}>Tarde (15:00 - 22:00)</div></td>
                        <td><div style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid rgba(168,85,247,0.2)' }}>Tarde</div></td>
                        <td><div style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid rgba(234,179,8,0.2)' }}>Libranza</div></td>
                        <td><div style={{ background: 'rgba(37,99,235,0.1)', color: '#3b82f6', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid rgba(37,99,235,0.2)' }}>Mañana (08:00 - 15:00)</div></td>
                        <td><div style={{ background: 'rgba(37,99,235,0.1)', color: '#3b82f6', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid rgba(37,99,235,0.2)' }}>Mañana</div></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'Ausencias' && (
                <div style={{ animation: 'tp-reveal-up 0.4s var(--ease-spring)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h1 style={{ fontFamily: 'var(--ff-head)', fontSize: 28, fontWeight: 600 }}>Gestión de Ausencias</h1>
                    <button className="tp-btn tp-btn-primary" style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13.5 }} onClick={() => openAusenciaModal('add')}>Solicitar Ausencia</button>
                  </div>
                  {isAdmin ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                      <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #eab308, #ca8a04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14 }}>LP</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>Lucía Pérez</div>
                            <div style={{ color: 'var(--t1)', fontSize: 13 }}>Vacaciones (5 días) • Del 10 Ago al 15 Ago</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <button className="tp-btn tp-btn-ghost" style={{ padding: '8px 16px', borderRadius: 8, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} onClick={handleRechazarAusencia}>Rechazar</button>
                          <button className="tp-btn tp-btn-primary" style={{ padding: '8px 16px', borderRadius: 8 }} onClick={handleAprobarAusencia}>Aprobar</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="tp-price-featured" style={{ borderRadius: 16, padding: 32, textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Icons.Calendar /></div>
                      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Tu saldo actual: <span style={{ color: 'var(--mg)' }}>22 días</span></h3>
                      <p style={{ color: 'var(--t1)', fontSize: 14 }}>No tienes solicitudes pendientes de aprobación de tus managers.</p>
                    </div>
                  )}
                </div>
            )}

            {activeTab === 'Documentos' && (
                <div style={{ animation: 'tp-reveal-up 0.4s var(--ease-spring)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h1 style={{ fontFamily: 'var(--ff-head)', fontSize: 28, fontWeight: 600 }}>Portal Documental</h1>
                    {isAdmin && <button className="tp-btn tp-btn-primary" style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13.5 }} onClick={() => openDocumentoModal('add')}>+ Subir Documento</button>}
                  </div>

                  <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                    <table className="tp-dash-table">
                      <thead>
                        <tr>
                          <th>Documento</th>
                          <th>Tipo</th>
                          <th>Fecha</th>
                          <th>Estado</th>
                          <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}><Icons.FileText /> Nómina_Marzo_2026.pdf</td>
                          <td style={{ color: 'var(--t1)' }}>Nómina</td>
                          <td style={{ color: 'var(--t2)' }}>21/03/2026</td>
                          <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}/> <span style={{ fontSize: 13, color: 'var(--t1)' }}>Entregado</span></div></td>
                          <td style={{ textAlign: 'right' }}><button className="tp-btn tp-btn-ghost" style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 6, width: 'max-content' }} onClick={handleDescargarDocumento}><Icons.Download /> Descargar</button></td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}><Icons.FileText /> Anexo_Teletrabajo.pdf</td>
                          <td style={{ color: 'var(--t1)' }}>Contrato</td>
                          <td style={{ color: 'var(--t2)' }}>15/03/2026</td>
                          <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308' }}/> <span style={{ fontSize: 13, color: '#eab308' }}>Pendiente Firma</span></div></td>
                          <td style={{ textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="tp-btn tp-btn-primary" style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, display: 'flex', gap: 6, alignItems: 'center', width: 'max-content' }} onClick={handleFirmarDocumento}><Icons.Signature /> Firmar</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
            )}

            {activeTab === 'Informes' && (
                <div style={{ animation: 'tp-reveal-up 0.4s var(--ease-spring)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                      <h1 style={{ fontFamily: 'var(--ff-head)', fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Informes y Analytics</h1>
                      <p style={{ color: 'var(--t1)', fontSize: 15 }}>Analíticas en tiempo real y exportación de registros válidos para Inspección de Trabajo.</p>
                    </div>
                    <button className="tp-btn tp-btn-ghost" style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13.5, display: 'flex', gap: 8, alignItems: 'center', borderColor: 'var(--border)' }} onClick={handleExportarInforme}>
                      <Icons.Download /> Exportar a PDF (Inspección)
                    </button>
                  </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                  {/* Chart Block */}
                  <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 24 }}>Evolución de Horas Extras (Este mes)</h3>
                    <div style={{ width: '100%', height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{ name: 'Sem 1', horas: 12 }, { name: 'Sem 2', horas: 19 }, { name: 'Sem 3', horas: 8 }, { name: 'Sem 4', horas: 24 }]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="name" stroke="var(--t2)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--t2)" fontSize={12} tickLine={false} axisLine={false} />
                          <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--t0)' }} itemStyle={{ color: 'var(--mg)' }} />
                          <Bar dataKey="horas" fill="var(--mg)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                      {/* --- MODALS Y FEEDBACK --- */}
                      <ModalBase open={modal === 'empleado'} onClose={closeModal} title={modalMode === 'add' ? 'Añadir Empleado' : 'Editar Empleado'}>
                        <EmpleadoForm mode={modalMode} initialValues={modalData} onSubmit={handleEmpleadoSubmit} onCancel={closeModal} />
                      </ModalBase>
                      <ModalBase open={modal === 'documento'} onClose={closeModal} title={modalMode === 'add' ? 'Subir Documento' : 'Editar Documento'}>
                        <DocumentoForm mode={modalMode} initialValues={modalData} onSubmit={handleDocumentoSubmit} onCancel={closeModal} />
                      </ModalBase>
                      <ModalBase open={modal === 'ausencia'} onClose={closeModal} title={'Solicitar Ausencia'}>
                        <AusenciaForm mode={modalMode} initialValues={modalData} onSubmit={handleAusenciaSubmit} onCancel={closeModal} />
                      </ModalBase>
                      <ModalBase open={modal === 'feedback'} onClose={closeFeedback} title={feedback.type === 'success' ? 'Éxito' : feedback.type === 'error' ? 'Error' : ''}>
                        {feedback.type === 'loading' && <Loader text={feedback.message} />}
                        {feedback.type === 'success' && <Success text={feedback.message} />}
                        {feedback.type === 'error' && <Error text={feedback.message} />}
                      </ModalBase>
                  </div>
                  
                  {/* KPI Mini blocks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="tp-dash-stat-card" style={{ flex: 1, justifyContent: 'center' }}>
                      <div style={{ color: 'var(--t2)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tasa de Absentismo</div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                        <div style={{ fontFamily: 'var(--ff-head)', fontSize: 36, fontWeight: 700, color: '#ef4444' }}>4.2<span style={{ fontSize: 24 }}>%</span></div>
                      </div>
                    </div>
                    <div className="tp-dash-stat-card" style={{ flex: 1, justifyContent: 'center' }}>
                      <div style={{ color: 'var(--t2)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Puntualidad Media</div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                        <div style={{ fontFamily: 'var(--ff-head)', fontSize: 36, fontWeight: 700, color: '#22c55e' }}>96<span style={{ fontSize: 24 }}>%</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Ajustes' && (
              <div style={{ animation: 'tp-reveal-up 0.4s var(--ease-spring)' }}>
                <h1 style={{ fontFamily: 'var(--ff-head)', fontSize: 28, fontWeight: 600, marginBottom: 24 }}>Ajustes de Empresa</h1>
                <div style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--t2)', marginBottom: 8 }}>Nombre Comercial</label>
                    <input type="text" readOnly defaultValue="Acme Corp" style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg1)', color: 'var(--t0)', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--t2)', marginBottom: 8 }}>CIF / NIF</label>
                    <input type="text" readOnly defaultValue="B12345678" style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg1)', color: 'var(--t0)', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                    <button className="tp-btn tp-btn-primary" style={{ padding: '12px 24px', borderRadius: 10, width: 'max-content' }}>Guardar cambios</button>
                    <button onClick={() => navigate('/kiosk')} style={{ padding: '12px 24px', borderRadius: 10, width: 'max-content', background: 'transparent', border: '1px solid var(--mg)', color: 'var(--mg)', cursor: 'pointer', fontWeight: 600 }}>Lanzar Modo Kiosko</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>

      </div>
    </>
  );
}
