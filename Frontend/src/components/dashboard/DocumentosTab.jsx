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
  CloudArrowUp
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import ModernTable from './ModernTable';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';

export default function DocumentosTab({ documents = [], onUpload, onDelete, onView }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

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
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    // Aquí conectarías con onUpload pasando los archivos o llamando al backend
    if(onUpload) onUpload(files);
  };

  const columns = [
    { 
      header: 'Nombre del Archivo', 
      cell: (row) => {
        const isPdf = row.name?.toLowerCase().endsWith('.pdf');
        return (
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center text-lg",
              isPdf ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
            )}>
               {isPdf ? <FilePdf weight="duotone" className="w-5 h-5" /> : <FileDoc weight="duotone" className="w-5 h-5" />}
            </div>
            <div>
              <div className="font-bold text-zinc-100 group-hover:text-white transition-colors">{row.name}</div>
              <div className="text-[10px] text-zinc-600 font-extrabold uppercase tracking-widest">{row.category || 'Sin Categoría'}</div>
            </div>
          </div>
        );
      }
    },
    { 
      header: 'Firma / Estado', 
      cell: (row) => {
        const isSigned = row.signed;
        const needsSignature = row.needsSignature;
        
        if (!needsSignature) return <Badge color="zinc">Solo Lectura</Badge>;
        
        return (
          <Badge color={isSigned ? 'emerald' : 'orange'}>
            {isSigned ? <CheckCircle className="w-3.5 h-3.5" weight="fill" /> : <Signature className="w-3.5 h-3.5" weight="duotone" />}
            {isSigned ? 'Firmado' : 'Pendiente Firma'}
          </Badge>
        );
      }
    },
    { 
      header: 'Fecha Subida', 
      cell: (row) => (
        <span className="text-[13px] font-semibold text-zinc-400">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      )
    },
    { 
      header: 'Tamaño', 
      cell: (row) => (
        <span className="text-[11px] font-mono font-bold text-zinc-600">
          {row.size ? `${(row.size / 1024 / 1024).toFixed(2)} MB` : '—'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <SectionHeader 
        icon={FileDoc}
        title="Repositorio Documental"
        subtitle="Almacena contratos, certificados y documentación corporativa encriptada."
      />

      {/* DRAG AND DROP ZONE */}
      <div 
        className={cn(
          "relative w-full h-48 rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 overflow-hidden cursor-pointer group",
          isDragging 
            ? "border-blue-500 bg-blue-500/10 scale-[1.01] shadow-[0_0_40px_rgba(59,130,246,0.15)]" 
            : "border-white/[0.1] bg-[#111114] hover:bg-white/[0.02] hover:border-white/[0.2]"
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
          "absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent transition-opacity duration-500",
          isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )} />
        
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform duration-300",
          isDragging ? "bg-blue-500 text-white scale-110 shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "bg-white/[0.05] text-zinc-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 group-hover:-translate-y-2"
        )}>
           <CloudArrowUp weight={isDragging ? "fill" : "duotone"} className="w-8 h-8" />
        </div>
        
        <h4 className={cn("text-lg font-black transition-colors", isDragging ? "text-blue-400" : "text-white")}>
          {isDragging ? "¡Suelta los archivos aquí!" : "Haz clic o arrastra documentos"}
        </h4>
        <p className="text-zinc-500 font-medium text-sm mt-1">Soporta PDF, Word, Excel e Imágenes hasta 50MB</p>
      </div>

      <div className="bg-[#0d0d0f] rounded-[24px] overflow-hidden border border-white/[0.04]">
        <ModernTable 
          columns={columns} 
          data={documents} 
          emptyIcon={FileDoc}
          emptyMessage="No hay documentos almacenados en la carpeta raíz."
          actions={(row) => (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onView(row); }}
                className="p-2.5 rounded-xl bg-white/[0.03] text-zinc-500 hover:text-white transition-all border border-transparent hover:border-white/10"
              >
                <Eye className="w-4 h-4" weight="duotone" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(row); }}
                className="p-2.5 rounded-xl bg-rose-500/5 text-rose-500/40 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20"
              >
                <TrashSimple className="w-4 h-4" weight="duotone" />
              </button>
            </>
          )}
        />
      </div>
    </div>
  );
}
