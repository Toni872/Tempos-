import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  IdentificationCard, 
  Clock, 
  Files, 
  Calendar, 
  UserCircle, 
  EnvelopeSimple, 
  Phone, 
  ShieldCheck, 
  MapPin, 
  QrCode, 
  LockKey, 
  TrendUp, 
  Trash, 
  PencilSimple, 
  X, 
  DownloadSimple, 
  Signature, 
  UploadSimple,
  CheckCircle,
  FilePdf,
  DotsThreeVertical,
  Warning
} from '@phosphor-icons/react';
import { listFichas, listAbsences, listDocuments, downloadDocument, signDocument, uploadDocument } from '@/lib/api';
import SignaturePad from 'signature_pad';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

function formatDate(v) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(v) {
  if (!v) return '—';
  return String(v).slice(0, 5);
}

const TABS = [
  { id: 'datos', label: 'Expediente', icon: IdentificationCard },
  { id: 'fichajes', label: 'Registros', icon: Clock },
  { id: 'vacaciones', label: 'Ausencias', icon: Calendar },
  { id: 'documentos', label: 'Legajos', icon: Files },
];

export default function ExpedienteEmpleado({ employee, token, onEdit, onDelete, onClose, isAdmin }) {
  const [tab, setTab] = useState('datos');
  const [fichas, setFichas] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isSigning, setIsSigning] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const uid = employee?.uid || employee?.id;

  const loadFichas = useCallback(async () => {
    if (!token || !uid) return;
    setLoading(true);
    try {
      const res = await listFichas(token, { userId: uid, limit: 30 });
      setFichas(Array.isArray(res?.data) ? res.data : []);
    } catch { setFichas([]); }
    finally { setLoading(false); }
  }, [token, uid]);

  const loadAbsences = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await listAbsences(token);
      const all = Array.isArray(res?.data) ? res.data : [];
      setAbsences(all.filter(a => a.userId === uid));
    } catch { setAbsences([]); }
    finally { setLoading(false); }
  }, [token, uid]);

  const loadDocuments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await listDocuments(token, isAdmin ? { userId: uid } : {});
      setDocuments(Array.isArray(res?.data) ? res.data : []);
    } catch { setDocuments([]); }
    finally { setLoading(false); }
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

  const totalHours = fichas.reduce((acc, f) => acc + (parseFloat(f.hoursWorked) || 0), 0);
  const hourlyRate = parseFloat(employee?.hourlyRate) || 0;
  const estimatedPay = (totalHours * hourlyRate).toFixed(2);

  const name = employee?.displayName || employee?.name || employee?.email?.split('@')[0] || '?';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/90 backdrop-blur-md overflow-y-auto py-12 px-6" onClick={onClose}>
      <div
        className="relative w-full max-w-6xl bg-[#0a0a0c] border border-white/5 rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-500 flex flex-col md:flex-row"
        onClick={e => e.stopPropagation()}
      >
        {/* SIDEBAR LEFT */}
        <aside className="w-full md:w-80 shrink-0 border-r border-white/5 bg-[#0d0d0f]/50 p-10 flex flex-col gap-10">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-5xl font-black text-white shadow-2xl shadow-blue-600/20">
                {initial}
              </div>
              {employee?.isWorking && (
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-2xl border-4 border-[#0d0d0f] shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse">
                  <Clock weight="fill" className="text-white w-4 h-4" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-1">{name}</h2>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{employee?.role || 'EMPLEADO'}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-[11px] uppercase tracking-widest border",
                  tab === t.id 
                    ? "bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-600/20" 
                    : "bg-white/5 text-white/40 border-transparent hover:bg-white/10"
                )}
              >
                <t.icon size={18} weight={tab === t.id ? "fill" : "bold"} />
                {t.label}
              </button>
            ))}
          </nav>

          {isAdmin && (
            <div className="mt-auto flex flex-col gap-3 pt-10 border-t border-white/5">
              <button onClick={onEdit} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                <PencilSimple size={16} weight="bold" /> Editar Perfil
              </button>
              <button onClick={onDelete} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                <Trash size={16} weight="bold" /> Suspender
              </button>
            </div>
          )}
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col min-h-[700px] bg-gradient-to-br from-[#0a0a0c] to-[#0d0d0f]">
          {/* TOP INFO BAR */}
          <header className="px-12 py-10 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-12">
               <div className="flex flex-col gap-1">
                 <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">ID Sistema</span>
                 <span className="text-xs font-mono text-white/60 tracking-tighter">{uid?.slice(0,12)}...</span>
               </div>
               <div className="flex flex-col gap-1">
                 <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Seguridad</span>
                 <div className="flex items-center gap-2">
                   <ShieldCheck size={14} className="text-emerald-500" weight="fill" />
                   <span className="text-[10px] font-black text-emerald-500/80 uppercase">Auditado por Tempos</span>
                 </div>
               </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-white/20 hover:text-white transition-all">
              <X size={24} weight="bold" />
            </button>
          </header>

          <section className="flex-1 overflow-y-auto p-12">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white/5 rounded-3xl" />)}
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {tab === 'datos' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InfoCard label="Email Oficial" value={employee?.email} icon={EnvelopeSimple} />
                      <InfoCard label="Teléfono" value={employee?.phone} icon={Phone} />
                      <InfoCard label="Departamento" value={employee?.department || 'Sede Central'} icon={MapPin} />
                      <InfoCard label="Sueldo Base" value={`${hourlyRate.toFixed(2)} €/h`} icon={TrendUp} highlight />
                    </div>
                    {isAdmin && (
                       <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl shadow-blue-500/5">
                          <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Coste Devengado (30D)</p>
                            <h3 className="text-4xl font-black text-white leading-none">{estimatedPay}€</h3>
                          </div>
                          <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white/40 uppercase">{totalHours.toFixed(1)}H Registradas</span>
                            <div className="flex gap-1">
                               {[1,2,3,4,5].map(i => <div key={i} className={`w-1.5 h-3 rounded-full ${i < 4 ? 'bg-blue-500' : 'bg-white/10'}`} />)}
                            </div>
                          </div>
                       </div>
                    )}
                  </div>
                )}

                {tab === 'fichajes' && (
                  <div className="space-y-6">
                    {fichas.length === 0 ? <EmptyState label="Sin historial de fichajes" /> : (
                      <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] overflow-hidden">
                        <table className="w-full text-left">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Fecha</th>
                              <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Jornada</th>
                              <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Inversión</th>
                              <th className="px-8 py-6 text-right text-[10px] font-black text-white/30 uppercase tracking-widest">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {fichas.map(f => (
                              <tr key={f.id} className="hover:bg-white/[0.03] transition-colors">
                                <td className="px-8 py-5 text-[11px] font-bold text-white/80">{formatDate(f.date)}</td>
                                <td className="px-8 py-5 flex items-center gap-3">
                                  <span className="text-[11px] font-black text-emerald-400">{formatTime(f.startTime)}</span>
                                  <div className="w-4 h-[1px] bg-white/10" />
                                  <span className="text-[11px] font-black text-rose-400">{formatTime(f.endTime)}</span>
                                </td>
                                <td className="px-8 py-5 text-[11px] font-black text-white">{parseFloat(f.hoursWorked || 0).toFixed(1)}H</td>
                                <td className="px-8 py-5 text-right">
                                  <Badge color={f.status === 'confirmed' ? 'emerald' : 'blue'}>{f.status === 'confirmed' ? 'AUDITADO' : 'PENDIENTE'}</Badge>
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
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                         <FilePdf className="text-rose-500" size={24} weight="fill" /> Legajos Firmados
                       </h3>
                       {isAdmin && (
                         <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-600/20">
                            <UploadSimple size={18} weight="bold" /> Subir Legajo
                         </button>
                       )}
                    </div>
                    
                    {documents.length === 0 ? <EmptyState label="No hay documentos en el legajo" /> : (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {documents.map(d => (
                          <div key={d.id} className="group flex items-center gap-6 bg-white/[0.03] p-6 rounded-[2.5rem] border border-white/5 hover:border-blue-500/30 transition-all hover:bg-white/[0.05]">
                            <div className={cn(
                              "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
                              d.status === 'signed' ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/20 group-hover:text-blue-400"
                            )}>
                              {d.status === 'signed' ? <CheckCircle size={32} weight="fill" /> : <FilePdf size={32} weight="bold" />}
                            </div>
                            <div className="flex-1 min-w-0">
                               <h4 className="text-xs font-black text-white uppercase tracking-tight truncate">{d.title}</h4>
                               <div className="flex items-center gap-3 mt-2">
                                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">{d.type}</span>
                                  <div className="w-1 h-1 rounded-full bg-white/10" />
                                  <span className="text-[9px] font-bold text-white/30">{formatDate(d.createdAt)}</span>
                               </div>
                            </div>
                            <div className="flex items-center gap-2">
                               <button onClick={() => handleDownload(d)} className="p-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl transition-all" title="Descargar">
                                 <DownloadSimple size={20} weight="bold" />
                               </button>
                               {d.status === 'pending' && !isAdmin && (
                                 <button onClick={() => setIsSigning(d)} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20">
                                   Firmar
                                 </button>
                               )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* MODALS */}
      {isSigning && (
        <SignatureModal 
          doc={isSigning} 
          token={token} 
          onClose={() => setIsSigning(null)} 
          onSuccess={() => { setIsSigning(null); loadDocuments(); }} 
        />
      )}
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

function InfoCard({ label, value, icon: Icon, highlight }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 hover:bg-white/[0.05] transition-all group">
      <div className="flex items-center gap-4 mb-4">
        <div className={cn("p-3 rounded-2xl transition-all", highlight ? "bg-blue-600/10 text-blue-400" : "bg-white/5 text-white/20 group-hover:text-white/40")}>
          <Icon size={20} weight="bold" />
        </div>
        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className={cn("text-sm font-bold tracking-tight truncate", highlight ? "text-blue-400" : "text-white/80")}>
        {value || '—'}
      </p>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center p-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
       <Warning size={48} weight="duotone" className="text-white/5 mb-6" />
       <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">{label}</p>
    </div>
  );
}

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
    if (signatureRef.current?.isEmpty()) return alert('Dibuja tu firma para continuar');
    setLoading(true);
    try {
      const signatureData = signatureRef.current.toDataURL();
      await signDocument(token, doc.id, { signatureData });
      onSuccess();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6">
      <div className="w-full max-w-xl bg-[#0d0d0f] border border-white/10 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-400">
        <h3 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">Certificación de Legajo</h3>
        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-10">Documento: <span className="text-blue-500">{doc.title}</span></p>
        
        <div className="relative bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden mb-10 cursor-crosshair">
           <canvas ref={canvasRef} className="w-full h-72" />
           <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-white/5 m-4 rounded-xl" />
        </div>

        <div className="flex gap-4">
           <button onClick={clear} className="px-8 py-5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all">Limpiar</button>
           <button onClick={save} disabled={loading} className="flex-1 px-8 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-2xl shadow-blue-600/30">
              {loading ? 'SELLANDO...' : 'FIRMAR DOCUMENTO'}
           </button>
           <button onClick={onClose} className="p-5 text-white/20 hover:text-white transition-all"><X size={20} weight="bold" /></button>
        </div>
      </div>
    </div>
  );
}

function UploadModal({ token, userId, onClose, onSuccess }) {
   const [file, setFile] = useState(null);
   const [title, setTitle] = useState('');
   const [type, setType] = useState('nomina');
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
         fd.append('requireSignature', 'true');
         await uploadDocument(token, fd);
         onSuccess();
      } catch (err) { alert(err.message); }
      finally { setLoading(false); }
   };

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6">
         <div className="w-full max-w-lg bg-[#0d0d0f] border border-white/10 rounded-[3rem] p-12 shadow-2xl animate-in fade-in zoom-in-95 duration-400">
            <h3 className="text-2xl font-black text-white tracking-tight mb-8 uppercase">Añadir al Legajo</h3>
            <div className="space-y-6">
               <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del legajo..." className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-white text-sm outline-none focus:border-blue-500/50 transition-all font-bold" />
               <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-white text-sm outline-none font-bold">
                  <option value="nomina">Nómina Mensual</option>
                  <option value="contrato">Contrato Laboral</option>
                  <option value="prevencion">PRL / Seguridad</option>
                  <option value="other">Otros Legajos</option>
               </select>
               <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/10 rounded-[2rem] cursor-pointer hover:bg-white/5 transition-all">
                  {file ? (
                    <div className="flex items-center gap-4 text-emerald-400">
                      <CheckCircle size={32} weight="fill" />
                      <span className="text-xs font-black uppercase tracking-tight">{file.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-white/20">
                      <UploadSimple size={32} weight="bold" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Soltar archivo aquí</span>
                    </div>
                  )}
                  <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
               </label>
            </div>
            <div className="flex gap-4 mt-10">
               <button onClick={onClose} className="px-8 py-5 text-white/20 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all">Cancelar</button>
               <button onClick={handleUpload} disabled={loading} className="flex-1 px-8 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-2xl shadow-blue-600/30">
                  {loading ? 'CARGANDO...' : 'SUBIR LEGAJO'}
               </button>
            </div>
         </div>
      </div>
   );
}
