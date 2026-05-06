import React, { useState } from 'react';
import { 
  FileDoc, 
  Tag, 
  Signature, 
  UploadSimple, 
  FloppyDisk,
  CheckCircle,
  FilePdf
} from '@phosphor-icons/react';
import Toggle from '@/components/ui/Toggle';
import { cn } from '@/lib/utils';

export default function DocumentoForm({ initialValues, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(initialValues ?? {
    name: '',
    category: 'Contratos',
    needsSignature: false,
    file: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, file: e.target.files[0], name: e.target.files[0]?.name || prev.name }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const categories = ['Contratos', 'Nóminas', 'Certificados', 'Varios'];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Archivo a subir</label>
          <div className="relative group">
            <input 
              type="file" 
              onChange={handleFileChange}
              className="hidden" 
              id="file-upload"
            />
            <label 
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/[0.06] rounded-3xl bg-white/[0.02] hover:bg-white/[0.04] hover:border-blue-500/30 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 mb-3 group-hover:scale-110 transition-transform">
                <UploadSimple weight="duotone" className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-zinc-300">{formData.file ? formData.file.name : 'Selecciona un archivo'}</p>
              <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest font-black">PDF, PNG, JPG hasta 10MB</p>
            </label>
          </div>
        </div>

        <FormInput 
          label="Nombre del Documento" 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          icon={FileDoc} 
          placeholder="Ej. Contrato de Prácticas" 
        />

        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Categoría</label>
          <div className="relative group">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" weight="bold" />
            <select 
              name="category" 
              value={formData.category} 
              onChange={handleChange}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-zinc-300 focus:outline-none focus:border-blue-500/40 transition-all appearance-none"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                 <Signature weight="duotone" className="w-5 h-5" />
              </div>
              <div>
                 <h4 className="text-xs font-black text-white uppercase tracking-widest leading-none">Requiere Firma Digital</h4>
                 <p className="text-[10px] text-zinc-600 font-medium mt-1">Notificar al empleado para su firma.</p>
              </div>
           </div>
           <Toggle 
              enabled={formData.needsSignature} 
              onChange={(val) => setFormData(p => ({ ...p, needsSignature: val }))} 
           />
        </div>
      </div>

      <div className="pt-6 border-t border-white/[0.04] flex items-center justify-end gap-4">
        <button type="button" onClick={onCancel} className="px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">
          Cancelar
        </button>
        <button type="submit" className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]">
           {initialValues?.id ? 'Actualizar Datos' : 'Subir Documento'}
        </button>
      </div>
    </form>
  );
}

function FormInput({ label, icon: Icon, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" weight="bold" />
        <input 
          {...props}
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-zinc-300 outline-none focus:border-blue-500/40 transition-all placeholder:text-zinc-700"
        />
      </div>
    </div>
  );
}
