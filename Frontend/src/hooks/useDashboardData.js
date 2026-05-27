import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
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
  listSchedules,
  listShiftAssignments,
  clearClientSession
} from '@/lib/api';

const FichaListSchema = z.array(z.object({
  id: z.string(),
  employeeId: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().nullable().optional(),
  status: z.string().optional(),
  metadata: z.any().optional(),
  employeeName: z.string().optional(),
})).optional().default([]);

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
  const [schedules, setSchedules] = useState([]);
  const [shiftAssignments, setShiftAssignments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isTrialExpired, setIsTrialExpired] = useState(false);

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
        const [user] = await Promise.all([getMe(token)]);
        if (user) {
          setProfile(user);
          currentUser = user;
          if (user.isTrialExpired) {
            setIsTrialExpired(true);
          }
        }
        
        let ficha = null;
        try {
          const fichaRes = await getActiveFicha(token);
          ficha = fichaRes?.data ?? fichaRes?.ficha ?? (fichaRes?.id ? fichaRes : null);
        } catch (e) {
          console.warn('Soft error loading active ficha:', e.message);
        }
        
        const currentFicha = ficha;
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
        if (type === 'all' || type === 'schedules') promises.push(safeCall(listSchedules(token), 'sch'));
        if (type === 'all' || type === 'schedules') promises.push(safeCall(listShiftAssignments(token), 'shifts'));
      }

      const results = await Promise.all(promises);
      const data = {};
      results.forEach(r => { if (r.data) data[r.key] = r.data; });

      if (data.docs) setDocuments(Array.isArray(data.docs) ? data.docs : []);
      if (data.abs) setAbsences(Array.isArray(data.abs) ? data.abs : []);
      if (data.fxs) {
        const rawFichas = Array.isArray(data.fxs) ? data.fxs : (data.fxs?.data || []);
        const parsedFichas = FichaListSchema.parse(rawFichas);
        setRegistros(parsedFichas);
      }
      if (data.emp) setEmployees(data.emp?.data || []);
      if (data.wcs) setWorkCenters(data.wcs?.data || data.wcs || []);
      if (data.dbStats) setDashboardStats(data.dbStats);
      if (data.sch) setSchedules(data.sch?.data || data.sch || []);
      if (data.shifts) setShiftAssignments(data.shifts?.data || data.shifts || []);

    } catch (err) {
      console.error('Error loading data:', err);
      if (err.status === 401) handleLogout();
      if (err.status === 402 || err.message?.includes('TRIAL_EXPIRED')) {
        setIsTrialExpired(true);
      }
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
    schedules, setSchedules,
    shiftAssignments, setShiftAssignments,
    loading,
    setLoading,
    isTrialExpired,
    loadData,
    handleLogout
  };
}
