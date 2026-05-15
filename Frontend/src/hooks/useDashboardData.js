import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { 
  getClientSession, 
  getMe, 
  getActiveFicha, 
  listDocuments, 
  listAbsences, 
  listFichas, 
  getDashboardStats, 
  listEmployees, 
  listWorkCenters,
  clearClientSession
} from '@/lib/api';

/**
 * Hook Senior para gestionar toda la carga de datos del Dashboard.
 * Centraliza la lógica de sincronización y estados de carga.
 */
export function useDashboardData(registrosFilters, isAdmin) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [activeFicha, setActiveFicha] = useState(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  
  // Tab Data
  const [employees, setEmployees] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  
  const [loading, setLoading] = useState(true);

  const handleLogout = useCallback(() => {
    clearClientSession();
    navigate('/login', { replace: true });
  }, [navigate]);

  const loadData = useCallback(async (type = 'all') => {
    const session = getClientSession();
    if (!session?.token) return;

    try {
      const token = session.token;
      
      // Carga de núcleo (Me y Ficha Activa)
      let currentUser = profile;
      if (type === 'all' || type === 'core') {
        const [user, ficha] = await Promise.all([getMe(token), getActiveFicha(token)]);
        if (user) {
          setProfile(user);
          currentUser = user;
        }
        
        const currentFicha = ficha?.data ?? ficha?.ficha ?? (ficha?.id ? ficha : null);
        setActiveFicha(currentFicha);
        setClockedIn(!!currentFicha);
        setIsOnBreak(currentFicha?.lastEvent?.type === 'BREAK_START' || currentFicha?.status === 'on_break');
      }

      const promises = [];
      const safeCall = async (fn, key) => {
        try {
          const res = await fn;
          return { key, data: res };
        } catch (e) {
          console.warn(`Soft error loading ${key}:`, e.message);
          return { key, data: null };
        }
      };

      if (type === 'all' || type === 'documents') promises.push(safeCall(listDocuments(token), 'docs'));
      if (type === 'all' || type === 'absences') promises.push(safeCall(listAbsences(token), 'abs'));
      if (type === 'all' || type === 'attendance') promises.push(safeCall(listFichas(token, registrosFilters), 'fxs'));

      const effectiveIsAdmin = isAdmin ?? (currentUser?.role === 'admin' || currentUser?.role === 'manager');
      if (effectiveIsAdmin) {
        if (type === 'all' || type === 'employees') promises.push(safeCall(listEmployees(token), 'emp'));
        if (type === 'all' || type === 'workCenters') promises.push(safeCall(listWorkCenters(token), 'wcs'));
        if (type === 'all' || type === 'dashboard') promises.push(safeCall(getDashboardStats(token), 'dbStats'));
      }

      const results = await Promise.all(promises);
      const data = {};
      results.forEach(r => { if (r.data) data[r.key] = r.data; });

      if (data.docs) setDocuments(Array.isArray(data.docs) ? data.docs : []);
      if (data.abs) setAbsences(Array.isArray(data.abs) ? data.abs : []);
      if (data.fxs) setRegistros(Array.isArray(data.fxs) ? data.fxs : (data.fxs?.data || []));
      if (data.emp) setEmployees(data.emp?.data || []);
      if (data.wcs) setWorkCenters(data.wcs?.data || data.wcs || []);
      if (data.dbStats) setDashboardStats(data.dbStats);

    } catch (err) {
      console.error('Error loading data:', err);
      if (err.status === 401) handleLogout();
    }
  }, [isAdmin, registrosFilters, handleLogout]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadData('all');
      setLoading(false);
    };
    init();
  }, [loadData]);

  // 🔄 REAL-TIME SYNC: Polling cada 15 segundos para mantener datos frescos
  useEffect(() => {
    const session = getClientSession();
    if (!session?.token) return;

    const interval = setInterval(() => {
      // Solo refrescamos los datos del núcleo (ficha activa y stats) para no saturar
      // Si es admin, cargamos también los fichajes globales
      loadData(isAdmin ? 'all' : 'core');
    }, 15000);

    return () => clearInterval(interval);
  }, [loadData, isAdmin]);

  return {
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
    loading,
    setLoading,
    loadData,
    handleLogout
  };
}
