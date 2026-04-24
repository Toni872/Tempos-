import React, { useState, useRef } from 'react';
import { FileText, Save, AlertCircle, UploadCloud, FileBadge, FileSliders, Link } from 'lucide-react';

export default function DocumentoForm({ initialValues, onSubmit, onCancel, loading }) {
  const safe = initialValues ?? {};
  const [nombre, setNombre] = useState(safe.nombre || safe.title || '');
  const [tipo, setTipo] = useState(safe.tipo || safe.type || 'Nómina');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  const typeOptions = [
    { value: 'Nómina', icon: FileSliders, label: 'Nómina' },
    { value: 'Contrato', icon: FileBadge, label: 'Contrato' },
    { value: 'Otro', icon: Link, label: 'Otro' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !file) {
      setError('Debes proporcionar un nombre y adjuntar un archivo.');
      return;
    }
    setError('');
    onSubmit({ title: nombre, type: tipo, file });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      if (!nombre) setNombre(droppedFile.name.split('.')[0]); // Auto-fill name
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!nombre) setNombre(selectedFile.name.split('.')[0]); // Auto-fill name
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Subir Documento</h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Nóminas, Contratos y Otros</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-200 font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Título del Documento</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            autoFocus
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-zinc-600 font-medium"
            placeholder="Ej: Contrato Indefinido 2024"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Tipo de Archivo</label>
          <div className="flex gap-2">
            {typeOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = tipo === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTipo(opt.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm transition-all focus:outline-none ${
                    isActive 
                      ? 'bg-blue-600/10 border-blue-500 focus:ring-2 ring-blue-500/50' 
                      : 'bg-white/[0.03] border-white/5 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                  <span className={`font-bold ${isActive ? 'text-blue-400' : 'text-zinc-400'}`}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Archivo Adjunto</label>
          
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleFileClick}
            className={`border-2 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-blue-500 bg-blue-500/5' 
                : file 
                  ? 'border-emerald-500/30 bg-emerald-500/5' 
                  : 'border-white/10 hover:border-white/20 bg-white/[0.01]'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,.doc,.docx,.jpg,.png"
              onChange={handleFileChange}
            />

            {file ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 scale-110 transition-transform">
                  <FileText className="w-8 h-8" />
                </div>
                <h4 className="text-white font-bold mb-1 truncate max-w-xs">{file.name}</h4>
                <p className="text-xs text-emerald-400 font-medium">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • Archivo Listo
                </p>
                <button 
                   type="button" 
                   onClick={(e) => { e.stopPropagation(); setFile(null); }}
                   className="mt-4 text-[11px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-400 transition-colors bg-rose-500/10 px-4 py-2 rounded-lg"
                >
                  Cambiar Archivo
                </button>
              </>
            ) : (
              <>
                <div className={`w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 mb-4 transition-transform duration-300 ${isDragging ? 'scale-125 text-blue-500 bg-blue-500/10' : ''}`}>
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h4 className="text-zinc-300 font-bold mb-1">Arrastra tu archivo aquí</h4>
                <p className="text-xs text-zinc-500">o haz clic para explorar tus carpetas</p>
                <div className="mt-4 flex gap-2 justify-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                  <span className="bg-white/5 px-2 py-1 rounded-md">PDF</span>
                  <span className="bg-white/5 px-2 py-1 rounded-md">DOCX</span>
                  <span className="bg-white/5 px-2 py-1 rounded-md">PNG</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-white/5">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-4 rounded-2xl bg-[#111114] border border-white/5 text-zinc-400 font-black text-[11px] uppercase tracking-widest hover:text-white transition-all focus:outline-none focus:ring-2 ring-white/10"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !file}
          className="flex-1 px-6 py-4 rounded-2xl bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 ring-blue-500/50"
        >
          {loading ? (
             <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar Documento
            </>
          )}
        </button>
      </div>
    </form>
  );
}
