import React, { useState, useRef, useEffect } from 'react';
import { 
  ChatTeardrop, 
  PaperPlaneRight, 
  Hash, 
  User, 
  MagnifyingGlass, 
  DotsThreeVertical,
  PlusCircle,
  Clock,
  X,
  PaperclipHorizontal,
  Smiley,
  Checks,
  UsersThree,
  ShieldCheck,
  Broadcast,
  Circle
} from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function MensajesTab({ profile }) {
  const [channels, setChannels] = useState([
    { id: 'gen', name: 'General Ops', type: 'channel', unread: 2 },
    { id: 'sop', name: 'Soporte Técnico', type: 'channel', unread: 0 },
    { id: 'adm', name: 'Administración Central', type: 'channel', unread: 5 }
  ]);
  const [activeChannel, setActiveChannel] = useState(channels[0]);
  const [messagesByChannel, setMessagesByChannel] = useState({
    'gen': [
      { senderName: 'SISTEMA', text: 'Protocolo de comunicación cifrado activado.', senderId: 'system', time: '09:00' },
      { senderName: 'Alex Operaciones', text: '¿Habéis revisado los nuevos horarios de la sede Madrid?', senderId: 'user1', time: '10:15' },
    ]
  });
  const [newMessage, setNewMessage] = useState('');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesByChannel, activeChannel]);

  const currentMessages = messagesByChannel[activeChannel?.id] || [];

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel) return;
    
    const msg = {
      senderName: profile?.displayName || 'OPERADOR PRINCIPAL',
      text: newMessage,
      senderId: 'me',
      isMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessagesByChannel(prev => ({
      ...prev,
      [activeChannel.id]: [...(prev[activeChannel.id] || []), msg]
    }));
    setNewMessage('');
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col gap-8 animate-in fade-in duration-700">
      <SectionHeader 
        icon={ChatTeardrop}
        title="Terminal de Coordinación"
        subtitle="Sincronización segura del equipo en tiempo real bajo protocolos de alta disponibilidad."
      />

      <div className="flex-1 flex gap-8 min-h-0">
        {/* SIDEBAR TÁCTICO */}
        <div className="w-80 flex flex-col shrink-0 bg-white/[0.01] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
               <Broadcast size={20} weight="fill" className="text-blue-500 animate-pulse" />
               <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Frecuencias</h3>
            </div>
            <button 
              onClick={() => setIsCreatingChannel(true)}
              className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:bg-blue-600 hover:text-white transition-all shadow-inner"
            >
              <PlusCircle size={20} weight="fill" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
             <div className="px-4 mb-4 mt-2">
                <div className="relative group">
                   <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10 group-focus-within:text-blue-500 transition-colors" weight="bold" />
                   <input placeholder="BUSCAR FRECUENCIA..." className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[9px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-white/5" />
                </div>
             </div>

            {channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel)}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-4 rounded-[1.5rem] transition-all duration-300 relative group",
                  activeChannel?.id === channel.id 
                    ? "bg-blue-600 shadow-xl shadow-blue-600/20" 
                    : "hover:bg-white/[0.03] text-white/20 hover:text-white/60"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                  activeChannel?.id === channel.id ? "bg-white/20 border-white/10" : "bg-white/5 border-white/5 group-hover:border-white/10"
                )}>
                  <Hash weight="bold" className={cn("w-5 h-5", activeChannel?.id === channel.id ? "text-white" : "text-white/10 group-hover:text-white/30")} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={cn("text-xs font-black italic uppercase tracking-tighter", activeChannel?.id === channel.id ? "text-white" : "text-white/40")}>{channel.name}</p>
                  <p className={cn("text-[9px] font-bold uppercase tracking-widest mt-1", activeChannel?.id === channel.id ? "text-white/40" : "text-white/10")}>Protocolo {channel.id.toUpperCase()}</p>
                </div>
                {channel.unread > 0 && activeChannel?.id !== channel.id && (
                  <div className="w-5 h-5 rounded-lg bg-blue-500 flex items-center justify-center text-[9px] font-black text-white shadow-lg shadow-blue-500/30">
                    {channel.unread}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* TERMINAL DE MENSAJERÍA */}
        <div className="flex-1 flex flex-col min-w-0 bg-white/[0.01] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
          {/* HEADER DE CANAL */}
          <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-md relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-inner">
                <Hash weight="fill" size={24} />
              </div>
              <div>
                <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">{activeChannel?.name || 'SELECCIONA FRECUENCIA'}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                  <span className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">Escuadrón en Línea</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <div className="flex -space-x-3 mr-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 border-2 border-[#0d0d0f] flex items-center justify-center text-[10px] font-black text-white">
                       {String.fromCharCode(64 + i)}
                    </div>
                  ))}
               </div>
               <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all border border-transparent hover:border-white/10">
                 <DotsThreeVertical weight="bold" size={24} />
               </button>
            </div>
          </div>

          {/* ÁREA DE CHAT */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-10 py-10 space-y-8 scrollbar-hide bg-[#0a0a0c]/40 relative">
            {/* GRID BACKGROUND S9 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_100%)] pointer-events-none" />
            
            <AnimatePresence initial={false}>
              {currentMessages.length > 0 ? currentMessages.map((msg, i) => {
                const isMe = msg.isMe || msg.senderId === 'me';
                const isSystem = msg.senderId === 'system';

                if (isSystem) return (
                  <div key={i} className="flex justify-center py-2">
                     <div className="px-6 py-2 rounded-full bg-white/[0.03] border border-white/5 flex items-center gap-3">
                        <ShieldCheck size={14} className="text-blue-500" weight="fill" />
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">{msg.text}</span>
                     </div>
                  </div>
                );

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    key={i} 
                    className={cn("flex items-end gap-4", isMe ? "flex-row-reverse" : "flex-row")}
                  >
                    {!isMe && (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg border border-white/5">
                        {msg.senderName.charAt(0)}
                      </div>
                    )}
                    <div className={cn("flex flex-col gap-2", isMe ? "items-end" : "items-start")}>
                      <div className={cn(
                        "max-w-[480px] px-8 py-5 rounded-[2rem] text-sm leading-relaxed shadow-2xl relative",
                        isMe 
                          ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-none border border-white/10" 
                          : "bg-[#16161a] text-white/80 border border-white/5 rounded-tl-none backdrop-blur-sm"
                      )}>
                        {msg.text}
                        <div className={cn(
                          "absolute top-4 w-4 h-4 rotate-45 border-t border-l",
                          isMe 
                            ? "bg-blue-600 -right-2 border-white/10" 
                            : "bg-[#16161a] -left-2 border-white/5"
                        )} />
                      </div>
                      <div className="flex items-center gap-3 px-2">
                         <span className="text-[9px] font-black text-white/10 uppercase tracking-widest italic">{msg.senderName}</span>
                         <div className="w-1 h-1 rounded-full bg-white/5" />
                         <span className="text-[9px] font-mono text-white/10 tracking-widest">{msg.time}</span>
                         {isMe && <Checks size={14} weight="fill" className="text-blue-500/40" />}
                      </div>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                  <ChatTeardrop size={80} weight="duotone" />
                  <p className="text-xs font-black uppercase tracking-[0.5em] mt-6 italic">Iniciando Enlace Táctico...</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* INPUT TERMINAL */}
          <div className="px-10 py-8 bg-white/[0.02] border-t border-white/5 backdrop-blur-xl relative z-10">
            <form onSubmit={handleSend} className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
                 <button type="button" className="text-white/10 hover:text-blue-500 transition-all active:scale-90">
                    <PaperclipHorizontal size={22} weight="bold" />
                 </button>
                 <div className="w-px h-6 bg-white/5" />
              </div>
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="TRANSMITIR MENSAJE AL ESCUADRÓN..."
                className="w-full bg-black/40 border border-white/5 rounded-[2rem] py-6 pl-20 pr-32 text-xs focus:outline-none focus:border-blue-500/40 transition-all font-bold text-white uppercase tracking-widest placeholder:text-white/5 shadow-inner"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                 <button type="button" className="text-white/10 hover:text-amber-500 transition-all active:scale-90">
                    <Smiley size={24} weight="bold" />
                 </button>
                 <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-14 h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all disabled:opacity-10 disabled:grayscale disabled:cursor-not-allowed active:scale-95 shadow-2xl shadow-blue-600/20"
                >
                  <PaperPlaneRight weight="fill" size={24} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
