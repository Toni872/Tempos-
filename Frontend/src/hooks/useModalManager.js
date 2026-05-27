import { useReducer, useCallback } from 'react';

const initialState = {
  // Form modal
  modal: null,
  modalMode: 'create',
  modalData: null,

  // Audit modal
  auditModalOpen: false,
  selectedAuditFichaId: null,

  // Geolocation consent
  showGeolocationConsent: false,
  geolocationModalMode: 'consent',

  // Selected employee (for expediente)
  selectedEmployee: null,

  // Terms acceptance
  hasAcceptedLocal: false,
};

function modalReducer(state, action) {
  switch (action.type) {
    case 'OPEN_MODAL':
      return {
        ...state,
        modal: action.payload.type,
        modalMode: action.payload.mode || 'create',
        modalData: action.payload.data || null,
      };
    case 'CLOSE_MODAL':
      return {
        ...state,
        modal: null,
        modalMode: 'create',
        modalData: null,
      };

    case 'OPEN_AUDIT':
      return {
        ...state,
        auditModalOpen: true,
        selectedAuditFichaId: action.payload.fichaId,
      };
    case 'CLOSE_AUDIT':
      return {
        ...state,
        auditModalOpen: false,
        selectedAuditFichaId: null,
      };

    case 'SET_GEOLOCATION_CONSENT':
      return {
        ...state,
        showGeolocationConsent: action.payload,
      };
    case 'SET_GEOLOCATION_MODE':
      return {
        ...state,
        geolocationModalMode: action.payload,
      };

    case 'SET_SELECTED_EMPLOYEE':
      return {
        ...state,
        selectedEmployee: action.payload,
      };

    case 'SET_ACCEPTED_TERMS':
      return {
        ...state,
        hasAcceptedLocal: action.payload,
      };

    case 'RESET_MODALS':
      return initialState;

    default:
      return state;
  }
}

export function useModalManager() {
  const [state, dispatch] = useReducer(modalReducer, initialState);

  const openModal = useCallback((type, mode = 'create', data = null) => {
    dispatch({ type: 'OPEN_MODAL', payload: { type, mode, data } });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, []);

  const openAudit = useCallback((fichaId) => {
    dispatch({ type: 'OPEN_AUDIT', payload: { fichaId } });
  }, []);

  const closeAudit = useCallback(() => {
    dispatch({ type: 'CLOSE_AUDIT' });
  }, []);

  const setGeolocationConsent = useCallback((show) => {
    dispatch({ type: 'SET_GEOLOCATION_CONSENT', payload: show });
  }, []);

  const setGeolocationMode = useCallback((mode) => {
    dispatch({ type: 'SET_GEOLOCATION_MODE', payload: mode });
  }, []);

  const setSelectedEmployee = useCallback((emp) => {
    dispatch({ type: 'SET_SELECTED_EMPLOYEE', payload: emp });
  }, []);

  const setAcceptedTerms = useCallback((accepted) => {
    dispatch({ type: 'SET_ACCEPTED_TERMS', payload: accepted });
  }, []);

  const resetModals = useCallback(() => {
    dispatch({ type: 'RESET_MODALS' });
  }, []);

  return {
    modal: state.modal,
    modalMode: state.modalMode,
    modalData: state.modalData,
    auditModalOpen: state.auditModalOpen,
    selectedAuditFichaId: state.selectedAuditFichaId,
    showGeolocationConsent: state.showGeolocationConsent,
    geolocationModalMode: state.geolocationModalMode,
    selectedEmployee: state.selectedEmployee,
    hasAcceptedLocal: state.hasAcceptedLocal,

    openModal,
    closeModal,
    openAudit,
    closeAudit,
    setGeolocationConsent,
    setGeolocationMode,
    setSelectedEmployee,
    setAcceptedTerms,
    resetModals,
  };
}
