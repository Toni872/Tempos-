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
      if (type === 'all' || type === 'core') {
        const [user, ficha] = await Promise.all([getMe(token), getActiveFicha(token)]);
        if (user) setProfile(user);
        
        const currentFicha = ficha?.data ?? ficha?.ficha ?? (ficha?.id ? ficha : null);
        setActiveFicha(currentFicha);
        setClockedIn(!!currentFicha);
        setIsOnBreak(currentFicha?.lastEvent?.type === 'BREAK_START' || currentFicha?.status === 'on_break');
      }

      const promises = [];
      const keys = [];

      if (type === 'all' || type === 'documents') { promises.push(listDocuments(token)); keys.push('docs'); }
      if (type === 'all' || type === 'absences') { promises.push(listAbsences(token)); keys.push('abs'); }
      if (type === 'all' || type === 'attendance') {
        promises.push(listFichas(token, registrosFilters));
        keys.push('fxs');
      }

      if (isAdmin) {
        if (type === 'all' || type === 'employees') { promises.push(listEmployees(token)); keys.push('emp'); }
        if (type === 'all' || type === 'workCenters') { promises.push(listWorkCenters(token)); keys.push('wcs'); }
        if (type === 'all' || type === 'dashboard') { promises.push(getDashboardStats(token)); keys.push('dbStats'); }
      }

      const results = await Promise.all(promises);
      const data = Object.fromEntries(keys.map((k, i) => [k, results[i]]));

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
