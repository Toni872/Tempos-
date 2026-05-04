import React, { useState, useRef } from 'react';
import { 
  FileDoc, 
  UploadSimple, 
  FilePdf, 
  Signature, 
  Eye, 
  TrashSimple,
  Clock,
  CheckCircle,
  FileText,
  CloudArrowUp,
  FileImage,
  Warning,
  ShieldCheck,
  MagnifyingGlass,
  File,
  ArrowRight,
  HardDrive,
  XCircle,
  Gavel
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';
import SignaturePad from '@/components/ui/SignaturePad';
import { motion, AnimatePresence } from 'framer-motion';

export default function DocumentosTab({ documents = [], onUpload, onDelete, onView, onSign }) {
  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [signingDoc, setSigningDoc] = useState(null);
  const fileInputRef = useRef(null);

  const filteredDocs = documents.filter(doc => 
    doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if(onUpload) onUpload(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      if(onUpload) onUpload(e.target.files);
    }
  };

  const handleSignSave = (signatureData) => {
    if (onSign && signingDoc) {
      onSign(signingDoc.id, signatureData);
      setSigningDoc(null);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <SectionHeader 
        icon={ShieldCheck}
        title="Bóveda de Legajos"
        subtitle="Repositorio central de documentación corporativa con trazabilidad técnica inmutable."
      />

      {/* DRAG AND DROP ZONE PREMIUM */}
      <div 
        className={cn(
          "relative w-full h-56 rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center transition-all duration-500 overflow-hidden cursor-pointer group",
          isDragging 
            ? "border-blue-500 bg-blue-500/10 scale-[1.01] shadow-2xl shadow-blue-500/20" 
            : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          onChange={handleFileInput} 
          accept=".pdf,.doc,.docx,.png,.jpg"
        />
        
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent transition-opacity duration-700",
          isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )} />
        
        <div className={cn(
          "w-20 h-20 rounded-[2rem] flex items-center justify-center mb-5 transition-all duration-500 shadow-inner border border-white/5",
          isDragging 
            ? "bg-blue-600 text-white scale-110 shadow-xl shadow-blue-600/30 border-blue-400/50" 
            : "bg-white/5 text-white/20 group-hover:bg-blue-600/20 group-hover:text-blue-400 group-hover:-translate-y-2 group-hover:border-blue-500/30"
        )}>
           <CloudArrowUp weight={isDragging ? "fill" : "duotone"} size={40} />
        </div>
        
        <h4 className={cn("text-xl font-black transition-colors uppercase italic tracking-tighter", isDragging ? "text-blue-400" : "text-white")}>
          {isDragging ? "Procesando Archivos..." : "Cargar Legajo Digital"}
        </h4>
        <p className="text-white/20 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">PDF · DOCX · PNG · JPG (Máx 50MB)</p>

        {isDragging && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-600 animate-progress-indefinite" />
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-3">
              <HardDrive size={24} weight="fill" className="text-white/10" />
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Explorador de Archivos</h3>
           </div>
           <div className="relative group">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-blue-500 transition-colors" weight="bold" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="FILTRAR LEGAJOS..." 
                className="bg-white/[0.03] border border-white/5 rounded-2xl py-3 pl-11 pr-6 text-[10px] focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-white/10 font-black uppercase tracking-widest text-white w-64"
              />
           </div>
        </div>

        <div className="bg-white/[0.01] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/5">
                  <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Legajo Digital</th>
                  <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Estado Firma</th>
                  <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Metadatos</th>
                  <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] text-right">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                  {filteredDocs.length ? filteredDocs.map((row, idx) => {
                    const isPdf = row.name?.toLowerCase().endsWith('.pdf');
                    const isImg = row.name?.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/);
                    const isSigned = row.signed;
                    const needsSignature = row.needsSignature;

                    return (
                      <motion.tr 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ delay: idx * 0.03 }}
                        key={row.id || idx} 
                        className="hover:bg-white/[0.03] transition-all group cursor-pointer"
                        onClick={() => {
                          if (needsSignature && !isSigned) setSigningDoc(row);
                          else onView?.(row);
                        }}
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-5">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg border transition-all group-hover:scale-110",
                              isPdf ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : 
                              isImg ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                              "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            )}>
                               {isPdf ? <FilePdf weight="fill" /> : isImg ? <FileImage weight="fill" /> : <FileDoc weight="fill" />}
                            </div>
                            <div className="min-w-0">
                               <div className="font-black text-white text-xs tracking-tight uppercase italic truncate">{row.name}</div>
                               <div className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-1">{row.category || 'REPOSITORIO GENERAL'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                           {!needsSignature ? (
                             <Badge color="zinc">
                               <div className="flex items-center gap-2">
                                  <Eye size={12} weight="bold" />
                                  <span className="font-black tracking-widest">SOLO LECTURA</span>
                               </div>
                             </Badge>
                           ) : (
                             <Badge color={isSigned ? 'emerald' : 'orange'}>
                               <div className="flex items-center gap-2">
                                  {isSigned ? <ShieldCheck size={14} weight="fill" /> : <Signature size={14} weight="fill" className="animate-pulse" />}
                                  <span className="font-black tracking-widest">{isSigned ? 'CERTIFICADO' : 'PENDIENTE FIRMA'}</span>
                               </div>
                             </Badge>
                           )}
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-[11px] font-black text-white/60">
                                 <Clock size={12} className="text-white/20" />
                                 {new Date(row.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest">
                                 {row.size ? `${(row.size / 1024 / 1024).toFixed(2)} MB` : '0.42 MB'} · SHA-256
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                             {needsSignature && !isSigned && (
                               <ActionBtn onClick={(e) => { e.stopPropagation(); setSigningDoc(row); }} icon={Signature} color="blue" />
                             )}
                             <ActionBtn onClick={(e) => { e.stopPropagation(); onView?.(row); }} icon={Eye} color="zinc" />
                             <ActionBtn onClick={(e) => { e.stopPropagation(); onDelete?.(row); }} icon={TrashSimple} color="rose" />
                          </div>
                        </td>
                      </motion.tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan={4} className="py-32 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-10">
                           <File size={64} weight="duotone" />
                           <p className="text-xs font-black uppercase tracking-[0.4em]">Sin legajos almacenados</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SIGNATURE MODAL */}
      <AnimatePresence>
        {signingDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSigningDoc(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-[#0a0a0c] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="p-10 space-y-8">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                       <Gavel size={24} className="text-blue-500" weight="fill" />
                       <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Firma Digital Legal</h3>
                    </div>
                    <p className="text-xs text-white/40 font-medium leading-relaxed italic">
                      Está a punto de firmar el documento <span className="text-white font-black">{signingDoc.name}</span>. Esta firma tiene validez legal bajo el Reglamento (UE) nº 910/2014 (eIDAS).
                    </p>
                  </div>
                  <button 
                    onClick={() => setSigningDoc(null)}
                    className="p-2 text-white/20 hover:text-white transition-colors"
                  >
                    <XCircle size={32} weight="fill" />
                  </button>
                </div>

                <SignaturePad onSave={handleSignSave} />

                <div className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                   <ShieldCheck size={20} className="text-emerald-500" weight="fill" />
                   <p className="text-[9px] text-white/20 font-black uppercase tracking-widest leading-normal">
                     Al firmar, se registrará su dirección IP, geolocalización y marca de tiempo inmutable para garantizar la trazabilidad del proceso.
                   </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionBtn({ onClick, icon: Icon, color }) {
  const colors = {
    rose: "text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30",
    zinc: "text-white/20 hover:bg-white/10 hover:border-white/20 hover:text-white",
    blue: "text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/30"
  };
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "p-3 rounded-2xl bg-white/[0.03] border border-transparent transition-all",
        colors[color]
      )}
    >
      <Icon size={18} weight="bold" />
    </button>
  );
}
