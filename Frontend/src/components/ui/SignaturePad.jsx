import React, { useRef, useState, useEffect } from 'react';
import { Eraser, CheckCircle, ArrowsCounterClockwise } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export default function SignaturePad({ onSave, className }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Ajustar resolución para pantallas retina
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#2563eb'; // Azul Tempos
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsEmpty(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const save = () => {
    if (isEmpty) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden group shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-48 cursor-crosshair touch-none"
        />
        
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em] italic">Firme aquí su conformidad</p>
          </div>
        )}

        <div className="absolute bottom-4 right-4 flex gap-2">
          <button 
            onClick={clear}
            className="p-3 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-xl transition-all border border-white/5 backdrop-blur-md"
            title="Borrar"
          >
            <Eraser size={16} weight="fill" />
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={save}
          disabled={isEmpty}
          className={cn(
            "flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-xl",
            isEmpty 
              ? "bg-white/5 text-white/10 border border-white/5 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 active:scale-[0.98]"
          )}
        >
          <CheckCircle size={18} weight="fill" />
          REGISTRAR FIRMA DIGITAL
        </button>
      </div>
    </div>
  );
}
