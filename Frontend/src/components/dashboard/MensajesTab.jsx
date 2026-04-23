import React, { useState } from 'react';
import { MessageSquare, Search, Send, Hash, Bell, Lock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MensajesTab({ profile }) {
  const [activeChannel, setActiveChannel] = useState('comunicados');
  const [message, setMessage] = useState('');

  const channels = [
    { id: 'comunicados', name: 'Comunicados', icon: Bell, type: 'public', unread: 2 },
    { id: 'rrhh', name: 'Recursos Humanos', icon: Lock, type: 'private', unread: 0 },
    { id: 'soporte', name: 'Soporte Tempos', icon: Hash, type: 'public', unread: 0 }
  ];

  const messages = [
    { id: 1, channel: 'comunicados', sender: 'Dirección', avatar: 'D', text: 'Bienvenidos al nuevo portal del empleado de Tempos. Por favor revisen sus cuadrantes de horarios actualizados.', time: '10:00', date: 'Hoy', isAdmin: true },
    { id: 2, channel: 'comunicados', sender: 'RRHH', avatar: 'R', text: 'Recordatorio: El viernes cerramos a las 15:00h por festivo local.', time: '12:30', date: 'Ayer', isAdmin: true },
    { id: 3, channel: 'rrhh', sender: 'Marta (RRHH)', avatar: 'M', text: 'He recibido tu nómina firmada, gracias.', time: '09:15', date: 'Hoy', isAdmin: false }
  ];

  const activeMessages = messages.filter(m => m.channel === activeChannel);
  const currentChannel = channels.find(c => c.id === activeChannel);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    // Lógica futura para enviar mensaje
    setMessage('');
  };

  return (
    <div className="h-[calc(100vh-140px)] flex bg-[#111114] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
      
      {/* Sidebar de Canales */}
      <div className="w-80 border-r border-white/5 flex flex-col bg-[#0d0d0f]/50">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
               <MessageSquare className="w-4 h-4" />
             </div>
             Mensajes
          </h2>
          <div className="mt-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Buscar canal o usuario..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:border-blue-500/50 text-white transition-all placeholder:text-zinc-600 font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
           <div>
             <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 px-2">Canales Oficiales</h3>
             <div className="space-y-1">
               {channels.map(channel => (
                 <button
                   key={channel.id}
                   onClick={() => setActiveChannel(channel.id)}
                   className={cn(
                     "w-full flex items-center justify-between p-3 rounded-xl transition-all group",
                     activeChannel === channel.id ? "bg-blue-500/10 border-blue-500/20" : "hover:bg-white/5"
                   )}
                 >
                   <div className="flex items-center gap-3">
                     <channel.icon className={cn("w-4 h-4", activeChannel === channel.id ? "text-blue-400" : "text-zinc-500")} />
                     <span className={cn("text-sm font-bold", activeChannel === channel.id ? "text-blue-400" : "text-zinc-400 group-hover:text-zinc-300")}>
                       {channel.name}
                     </span>
                   </div>
                   {channel.unread > 0 && (
                     <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-blue-600/20">
                       {channel.unread}
                     </div>
                   )}
                 </button>
               ))}
             </div>
           </div>
        </div>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 flex flex-col bg-[#111114]">
        {/* Chat Header */}
        <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-zinc-900/40">
           <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400">
                {currentChannel?.type === 'public' ? <Hash className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
             </div>
             <div>
               <h3 className="text-lg font-bold text-white">{currentChannel?.name}</h3>
               <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                 {currentChannel?.type === 'public' ? 'Canal de Empresa' : 'Canal Privado'}
               </p>
             </div>
           </div>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
           <div className="text-center pb-6">
              <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Inicio de la conversación
              </span>
           </div>

           {activeMessages.map(msg => (
             <div key={msg.id} className="flex gap-4">
               <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/20">
                 {msg.avatar}
               </div>
               <div className="flex-1 space-y-1">
                 <div className="flex items-baseline gap-2">
                   <span className="font-bold text-sm text-white">{msg.sender}</span>
                   {msg.isAdmin && <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] uppercase tracking-wider font-black">Admin</span>}
                   <span className="text-[10px] font-bold text-zinc-600">{msg.time}</span>
                 </div>
                 <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-4 text-sm text-zinc-300 w-fit max-w-[80%] leading-relaxed">
                   {msg.text}
                 </div>
               </div>
             </div>
           ))}
        </div>

        {/* Input */}
        <div className="p-6 bg-zinc-900/40 border-t border-white/5">
          <form onSubmit={handleSend} className="relative flex items-end gap-4">
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Enviar mensaje a ${currentChannel?.name}...`}
              className="w-full bg-[#0d0d0f] border border-white/10 rounded-2xl p-4 pr-16 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500/50 outline-none resize-none h-14 custom-scrollbar"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <button 
              type="submit"
              disabled={!message.trim()}
              className="absolute right-3 top-2 h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex items-center justify-center transition-colors shadow-lg shadow-blue-600/20 disabled:shadow-none"
            >
              <Send className="w-4 h-4 ml-1" />
            </button>
          </form>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-3 text-center">
             Presiona Enter para enviar, Shift + Enter para salto de línea
          </p>
        </div>
      </div>

    </div>
  );
}
