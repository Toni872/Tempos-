import { useState, useEffect, useCallback, useRef } from 'react';
import { listFichas, listAbsences, listDocuments, downloadDocument, signDocument, uploadDocument } from '@/lib/api';
import SignaturePad from 'signature_pad';

function formatDate(v) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatTime(v) {
  if (!v) return '—';
  return String(v).slice(0, 5);
}

const TABS = [
  { id: 'datos', label: 'Datos' },
  { id: 'fichajes', label: 'Fichajes' },
  { id: 'vacaciones', label: 'Vacaciones' },
  { id: 'documentos', label: 'Documentos' },
];

export default function ExpedienteEmpleado({ employee, token, onEdit, onDelete, onClose, isAdmin }) {
  const [tab, setTab] = useState('datos');
  const [fichas, setFichas] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Signature States
  const [isSigning, setIsSigning] = useState(null); // Document object being signed
  const [showUpload, setShowUpload] = useState(false);

  const uid = employee?.uid || employee?.id;

  const loadFichas = useCallback(async () => {
    if (!token || !uid) return;
    setLoading(true);
    try {
      const res = await listFichas(token, { userId: uid, limit: 30 });
      setFichas(Array.isArray(res?.data) ? res.data : []);
    } catch { setFichas([]); }
    setLoading(false);
  }, [token, uid]);

  const loadAbsences = useCallback(async () => {
    if (!token) return;
    try {
      const res = await listAbsences(token);
      const all = Array.isArray(res?.data) ? res.data : [];
      setAbsences(all.filter(a => a.userId === uid));
    } catch { setAbsences([]); }
  }, [token, uid]);

  const loadDocuments = useCallback(async () => {
    if (!token) return;
    try {
      // Admins can see specific users docs, employees see their own
      const res = await listDocuments(token, isAdmin ? { userId: uid } : {});
      setDocuments(Array.isArray(res?.data) ? res.data : []);
    } catch { setDocuments([]); }
  }, [token, uid, isAdmin]);

  useEffect(() => {
    if (tab === 'fichajes') loadFichas();
    if (tab === 'vacaciones') loadAbsences();
    if (tab === 'documentos') loadDocuments();
  }, [tab, loadFichas, loadAbsences, loadDocuments]);

  const handleDownload = async (doc) => {
    try {
      const blob = await downloadDocument(token, doc.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = doc.filename || `${doc.title}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {}
  };

  // Stats computation
  const totalHours = fichas.reduce((acc, f) => acc + (parseFloat(f.hoursWorked) || 0), 0);
  const regularHours = Math.min(totalHours, fichas.length * 8);
  const overtimeHours = Math.max(0, totalHours - regularHours);
  const hourlyRate = parseFloat(employee?.hourlyRate) || 0;
  const overtimeRate = parseFloat(employee?.overtimeRate) || 0;
  const estimatedPay = (regularHours * hourlyRate + overtimeHours * overtimeRate).toFixed(2);

  const name = employee?.displayName || employee?.name || employee?.email?.split('@')[0] || '?';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-md overflow-y-auto py-6 px-4" onClick={onClose}>
      <div
        className="relative w-full max-w-5xl bg-[#0d0d0f] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-400"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-white/5 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                {initial}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#0d0d0f] ${employee?.isWorking ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-white/20'}`} />
            </div>
            <div>
              <h2 className="text-3xl font-black font-['Space_Grotesk'] text-white tracking-tight">{name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-white/40 text-sm font-medium">{employee?.email}</span>
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                  {employee?.role === 'admin' ? 'Super Admin' : employee?.role === 'manager' ? 'Mánager' : 'Personal'}
                </span>
                {employee?.isWorking && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 animate-pulse">
                    Activo Ahora
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button onClick={onEdit} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold rounded-2xl transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Perfil
              </button>
            )}
            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-red-500/20 rounded-2xl transition-all text-white/20 hover:text-red-400 border border-white/5 hover:border-red-500/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>

        <div className="flex min-h-[600px]">
          {/* Sidebar */}
          <aside className="w-72 shrink-0 border-r border-white/5 p-8 flex flex-col gap-8 bg-[#0d0d0f]">
            <div>
              <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-6">Seguridad Activa</div>
              <div className="flex flex-col gap-4">
                <SecurityBadge active={employee?.requiresGeolocation} icon="gps" label="Fichaje GPS" />
                <SecurityBadge active={employee?.requiresQR} icon="qr" label="Acceso QR" />
                <SecurityBadge active={!!employee?.kioskPin} icon="pin" label="PIN Seguridad" />
              </div>
            </div>

            {isAdmin && tab === 'fichajes' && (
               <div className="mt-4 p-6 rounded-[2rem] bg-gradient-to-br from-blue-600 to-purple-700 shadow-xl shadow-blue-500/10">
                  <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Coste Salarial Est.</div>
                  <div className="text-3xl font-black text-white">{estimatedPay}€</div>
                  <div className="h-1 w-full bg-white/10 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-white/40" style={{ width: '70%' }} />
                  </div>
                  <div className="flex justify-between items-center mt-3 text-[10px] text-white/60 font-bold uppercase tracking-tighter">
                    <span>{totalHours.toFixed(1)}h Totales</span>
                    <span className="text-emerald-300">+{overtimeHours.toFixed(1)}h Extra</span>
                  </div>
               </div>
            )}

            {isAdmin && (
              <div className="mt-auto">
                <button onClick={onDelete} className="group w-full px-5 py-4 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/10 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3">
                  <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                  Suspender Empleado
                </button>
              </div>
            )}
          </aside>

          {/* Main Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#121214]/50">
            <div className="flex border-b border-white/5 px-10 pt-6">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-6 py-4 text-xs font-black uppercase tracking-widest relative transition-all ${tab === t.id ? 'text-blue-400' : 'text-white/20 hover:text-white/60'}`}
                >
                  {t.label}
                  {tab === t.id && <div className="absolute bottom-0 left-6 right-6 h-1 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-10">
              {tab === 'datos' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                  <DataField label="Nombre completo" value={name} />
                  <DataField label="Contacto Directo" value={employee?.phone || employee?.email} />
                  <DataField label="Categoría Profesional" value={employee?.department || 'General'} />
                  <DataField label="Sueldo Base (H)" value={`${hourlyRate.toFixed(2)} €/h`} />
                  <DataField label="Estado en Plataforma" value="Verificado" highlight />
                  <DataField label="UUID Interno" value={uid} mono />
                </div>
              )}

              {tab === 'fichajes' && (
                <div className="animate-in fade-in duration-500">
                  {fichas.length === 0 ? (
                    <EmptyState label="Sin registros de fichaje para mostrar" />
                  ) : (
                    <div className="overflow-hidden rounded-3xl border border-white/5 bg-[#0d0d0f]/60 backdrop-blur-md">
                      <table className="w-full text-left text-[11px] font-bold uppercase tracking-wider">
                        <thead className="bg-white/5 text-white/20">
                          <tr>
                            <th className="px-6 py-5">Fecha</th>
                            <th className="px-6 py-5">Entrada / Salida</th>
                            <th className="px-6 py-5">Inversión Temporal</th>
                            <th className="px-6 py-5 text-right">Estatus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/70">
                          {fichas.map(f => (
                            <tr key={f.id} className="hover:bg-white/[0.03] transition-colors group">
                              <td className="px-6 py-4 text-white/90">{formatDate(f.date)}</td>
                              <td className="px-6 py-4">
                                <span className="text-emerald-400">{formatTime(f.startTime)}</span>
                                <span className="mx-2 text-white/10">→</span>
                                <span className="text-red-400">{formatTime(f.endTime)}</span>
                              </td>
                              <td className="px-6 py-4 font-black text-white">{f.hoursWorked ? `${parseFloat(f.hoursWorked).toFixed(1)}H` : '—'}</td>
                              <td className="px-6 py-4 text-right">
                                <span className={`px-3 py-1 rounded-lg border ${
                                  f.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                }`}>
                                  {f.status === 'confirmed' ? 'Auditado' : 'Borrador'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'documentos' && (
                <div className="animate-in fade-in duration-500">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-lg font-bold text-white tracking-tight">Expediente Documental</h3>
                     {isAdmin && (
                        <button onClick={() => setShowUpload(true)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/10 flex items-center gap-2">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                           Añadir Documento
                        </button>
                     )}
                  </div>

                  {documents.length === 0 ? (
                    <EmptyState label="Sin documentos cargados en el expediente" />
                  ) : (
                    <div className="grid gap-4">
                      {documents.map(d => (
                        <div key={d.id} className="group flex items-center gap-5 bg-[#0d0d0f]/80 p-5 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all shadow-lg hover:shadow-blue-500/5">
                          <div className={`p-4 rounded-2xl ${d.status === 'signed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/20 group-hover:text-blue-400 group-hover:bg-blue-500/10'} transition-all`}>
                            {d.status === 'signed' ? (
                               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            ) : (
                               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-white text-sm truncate uppercase tracking-tight">{d.title || 'Documento sin nombre'}</div>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">{d.type || 'Otro'}</span>
                               <span className="text-white/10 text-xs">·</span>
                               <span className="text-[10px] font-bold text-white/30">{formatDate(d.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleDownload(d)} className="p-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl border border-white/5 transition-all" title="Descargar">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1m8-12v12m0 0l-4-4m4 4l4-4" /></svg>
                            </button>
                            {d.status === 'pending' && !isAdmin && (
                              <button onClick={() => setIsSigning(d)} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20">
                                Firmar Ahora
                              </button>
                            )}
                            {d.status === 'signed' && (
                               <div className="px-4 py-2 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2">
                                  CERTIFICADO
                               </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {isSigning && (
        <SignatureModal 
          doc={isSigning} 
          token={token} 
          onClose={() => setIsSigning(null)} 
          onSuccess={() => { setIsSigning(null); loadDocuments(); }} 
        />
      )}

      {/* Upload Modal (Admin only) */}
      {showUpload && (
        <UploadModal 
          token={token} 
          userId={uid} 
          onClose={() => setShowUpload(false)} 
          onSuccess={() => { setShowUpload(false); loadDocuments(); }} 
        />
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Sub-components
// --------------------------------------------------------------------------

function SignatureModal({ doc, token, onClose, onSuccess }) {
  const canvasRef = useRef(null);
  const signatureRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      signatureRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor: '#3b82f6',
      });
    }
  }, []);

  const clear = () => signatureRef.current?.clear();

  const save = async () => {
    if (signatureRef.current?.isEmpty()) return alert('Por favor, firma antes de confirmar');
    
    setLoading(true);
    try {
      const signatureData = signatureRef.current.toDataURL(); // base64
      
      // Attempt location for legal evidence
      let location = null;
      try {
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (err) { console.warn('Geolocation denied'); }

      await signDocument(token, doc.id, { signatureData, location });
      onSuccess();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <div className="w-full max-w-lg bg-[#111113] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Firma Digital Legal</h3>
        <p className="text-sm text-white/30 font-medium mb-8 uppercase tracking-widest text-[10px]">
           Estás firmando el documento: <span className="text-blue-400">{doc.title}</span>
        </p>
        
        <div className="relative group bg-white/5 border border-white/10 rounded-3xl overflow-hidden mb-8">
           <canvas ref={canvasRef} className="w-full h-64 cursor-crosshair" />
           <div className="absolute inset-0 pointer-events-none border-4 border-dashed border-white/[0.03] rounded-3xl" />
        </div>

        <div className="flex items-center gap-3">
           <button onClick={clear} className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all border border-white/5">
              Limpiar
           </button>
           <button 
             onClick={save} 
             disabled={loading}
             className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-blue-500/20"
           >
              {loading ? 'PROCESANDO FIRMA...' : 'CONFIRMAR Y FIRMAR'}
           </button>
           <button onClick={onClose} className="p-4 text-white/20 hover:text-white transition-colors">
              Cancelar
           </button>
        </div>
        
        <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-3 opacity-20 hover:opacity-100 transition-opacity">
           <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
           <span className="text-[9px] font-bold text-white uppercase tracking-tighter">Cifrado de grado militar · Registro de IP y GPS activo</span>
        </div>
      </div>
    </div>
  );
}

function UploadModal({ token, userId, onClose, onSuccess }) {
   const [file, setFile] = useState(null);
   const [title, setTitle] = useState('');
   const [type, setType] = useState('nomina');
   const [reqSig, setReqSig] = useState(true);
   const [loading, setLoading] = useState(false);

   const handleUpload = async () => {
      if (!file) return alert('Selecciona un archivo');
      setLoading(true);
      try {
         const fd = new FormData();
         fd.append('file', file);
         fd.append('userId', userId);
         fd.append('title', title || file.name);
         fd.append('type', type);
         fd.append('requireSignature', reqSig ? 'true' : 'false');
         
         await uploadDocument(token, fd);
         onSuccess();
      } catch (err) { alert(err.message); }
      finally { setLoading(false); }
   };

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
         <div className="w-full max-w-md bg-[#111113] border border-white/10 rounded-[2.5rem] p-10 animate-in fade-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6">Subir Documento al Expediente</h3>
            
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Título del documento</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Nómina Marzo 2024" className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-blue-500/50 transition-all font-bold" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Categoría</label>
                     <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm outline-none font-bold">
                        <option value="nomina">Nómina</option>
                        <option value="contrato">Contrato</option>
                        <option value="prevencion">Prevención</option>
                        <option value="other">Otro</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Firma Digital</label>
                     <button onClick={() => setReqSig(!reqSig)} className={`w-full h-[52px] rounded-2xl border transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-tighter ${reqSig ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/5 text-white/20'}`}>
                        {reqSig ? 'Requerida' : 'No requerida'}
                     </button>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Archivo (PDF, Imágenes)</label>
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-[2rem] cursor-pointer hover:bg-white/5 hover:border-blue-500/30 transition-all overflow-hidden group">
                     {file ? (
                        <div className="flex flex-col items-center gap-2">
                           <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></div>
                           <span className="text-xs font-bold text-white/60">{file.name}</span>
                        </div>
                     ) : (
                        <div className="flex flex-col items-center gap-2">
                           <svg className="w-8 h-8 text-white/20 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                           <span className="text-[10px] font-black uppercase text-white/15">Click para seleccionar</span>
                        </div>
                     )}
                     <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
                  </label>
               </div>
            </div>

            <div className="flex items-center gap-3 mt-10">
               <button onClick={onClose} className="px-6 py-4 text-white/20 hover:text-white text-[11px] font-black uppercase tracking-widest transition-all">Cancelar</button>
               <button onClick={handleUpload} className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-500/20">Subir Documento</button>
            </div>
         </div>
      </div>
   )
}

function EmptyState({ label }) {
   return (
      <div className="flex flex-col items-center justify-center p-20 text-white/10 gap-5 bg-[#0d0d0f]/20 rounded-[3rem] border border-dashed border-white/5">
         <svg className="w-16 h-16 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
         <span className="font-black italic text-sm tracking-widest uppercase opacity-20">{label}</span>
      </div>
   )
}

function SecurityBadge({ active, icon, label }) {
  const icons = {
    gps: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>,
    qr: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m0 11v1m8-5h1M4 12h1m1.5-4.897L7 8.5M17.5 7.103L16 8.5M6.5 17.103L8 15.5M17.5 17.103L16 15.5"></path></svg>,
    pin: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>,
  };
  return (
    <div className={`flex items-center gap-4 p-4 rounded-3xl border transition-all duration-300 ${active ? 'bg-blue-600/10 border-blue-500/30' : 'bg-white/5 border-white/5'}`}>
      <div className={`p-2 rounded-xl scale-110 ${active ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/5 text-white/20'}`}>
        {icons[icon]}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-white/20'}`}>{label}</span>
    </div>
  );
}

function DataField({ label, value, mono, highlight }) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.05] transition-all">
      <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">{label}</div>
      <div className={`text-md font-bold ${highlight ? 'text-blue-400' : 'text-white/80'} ${mono ? 'font-mono text-xs' : ''} truncate`}>
        {value || '—'}
      </div>
    </div>
  );
}
