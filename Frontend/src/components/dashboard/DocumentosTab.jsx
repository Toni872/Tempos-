import React from 'react';
import { FileText, Download, PenTool, CheckCircle, FileBadge, FileSliders, Link as LinkIcon, FolderOpen } from 'lucide-react';

export default function DocumentosTab({ 
  documents = [], 
  isAdmin = false, 
  onUploadDocument, 
  onDownloadDocument, 
  onSignDocument 
}) {
  
  const getIconForType = (type) => {
    switch (type) {
      case 'Nómina': return <FileSliders className="w-5 h-5 text-blue-400" />;
      case 'Contrato': return <FileBadge className="w-5 h-5 text-purple-400" />;
      default: return <LinkIcon className="w-5 h-5 text-zinc-400" />;
    }
  };

  const getBgForType = (type) => {
    switch (type) {
      case 'Nómina': return 'bg-blue-500/10 border-blue-500/20';
      case 'Contrato': return 'bg-purple-500/10 border-purple-500/20';
      default: return 'bg-white/5 border-white/10';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111114] border border-white/5 p-6 rounded-[2rem] shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <FolderOpen className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Archivos y Contratos</h2>
            <p className="text-zinc-500 text-sm font-medium">Gestión documental, nóminas y firmas digitales</p>
          </div>
        </div>
        {isAdmin && (
          <button 
            onClick={onUploadDocument} 
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <span>Subir Documento</span>
          </button>
        )}
      </div>

      <div className="bg-[#111114] border border-white/5 rounded-[2rem] p-6 lg:p-8">
        <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-6 px-2">Documentos Recientes</h3>
        
        {documents.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-white/[0.02] rounded-full flex items-center justify-center border border-white/5 mb-4">
              <FileText className="w-10 h-10 text-zinc-600" />
            </div>
            <p className="text-lg font-bold text-white mb-1">Tu carpeta está vacía</p>
            <p className="text-zinc-500 text-sm">No hay documentos subidos actualmente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {documents.map(d => {
              const isSigned = d.status === 'signed';
              
              return (
                <div key={d.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] transition-all group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${getBgForType(d.type)}`}>
                        {getIconForType(d.type)}
                      </div>
                      <div className="flex items-center gap-2">
                        {isSigned ? (
                           <span className="bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1">
                             <CheckCircle className="w-3 h-3" /> Firmado
                           </span>
                        ) : (
                           <span className="bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                             Pendiente
                           </span>
                        )}
                        <span className="bg-white/5 text-zinc-400 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-white/10">
                          {d.type || 'Doc'}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-bold text-white text-base leading-tight mb-1 truncate" title={d.title || d.filename}>
                       {d.title || d.filename}
                    </h4>
                    <p className="text-xs text-zinc-500 font-mono mb-4">
                       {new Date(d.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-4 border-t border-white/5 mt-auto">
                    <button 
                      onClick={() => onDownloadDocument(d)} 
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-300 font-bold text-xs transition-all border border-white/5"
                    >
                      <Download className="w-4 h-4" /> 
                      Descargar
                    </button>
                    
                    {!isSigned && (
                      <button 
                        onClick={() => onSignDocument(d)} 
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-bold text-xs rounded-xl transition-all border border-blue-500/20"
                      >
                        <PenTool className="w-4 h-4" /> 
                        Firmar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
