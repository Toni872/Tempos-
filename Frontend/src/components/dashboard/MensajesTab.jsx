import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
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

export default function MensajesTab({ profile, employees = [] }) {
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [mutedChannels, setMutedChannels] = useState(new Set());
  const [archivedChannels, setArchivedChannels] = useState([]);
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

  const handleDeleteMessage = (index) => {
    setMessagesByChannel(prev => ({
      ...prev,
      [activeChannel.id]: prev[activeChannel.id].filter((_, i) => i !== index)
    }));
  };

  const addEmoji = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const toggleMute = () => {
    if (!activeChannel) return;
    setMutedChannels(prev => {
      const next = new Set(prev);
      if (next.has(activeChannel.id)) next.delete(activeChannel.id);
      else next.add(activeChannel.id);
      return next;
    });
    setShowOptionsMenu(false);
  };

  const archiveChannel = () => {
    if (!activeChannel) return;
    if (confirm(`¿Confirmar archivado de la frecuencia ${activeChannel.name}? El enlace se moverá al registro histórico.`)) {
      setArchivedChannels(prev => [...prev, activeChannel]);
      setChannels(prev => prev.filter(c => c.id !== activeChannel.id));
      setActiveChannel(null);
      setShowOptionsMenu(false);
    }
  };

  const restoreChannel = (channel) => {
    setChannels(prev => [...prev, channel]);
    setArchivedChannels(prev => prev.filter(c => c.id !== channel.id));
    alert(`Frecuencia ${channel.name} restaurada.`);
  };

  const permanentlyDeleteChannel = (channel) => {
    if (confirm(`¿ELIMINAR DEFINITIVAMENTE la frecuencia ${channel.name}? Esta acción no se puede deshacer.`)) {
      setArchivedChannels(prev => prev.filter(c => c.id !== channel.id));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const msg = {
        senderName: profile?.displayName || 'OPERADOR PRINCIPAL',
        text: `Adjunto: ${file.name}`,
        attachment: {
          name: file.name,
          type: file.type,
          url: reader.result,
          isImage: file.type.startsWith('image/')
        },
        senderId: 'me',
        isMe: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessagesByChannel(prev => ({
        ...prev,
        [activeChannel.id]: [...(prev[activeChannel.id] || []), msg]
      }));
    };
    reader.readAsDataURL(file);
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
               <Broadcast size={20} weight="fill" className={cn("text-blue-500", !showArchived && "animate-pulse")} />
               <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">{showArchived ? 'Histórico' : 'Frecuencias'}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowArchived(!showArchived)}
                title={showArchived ? "Ver Activos" : "Ver Archivados"}
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-inner border border-transparent",
                  showArchived ? "bg-amber-500/20 text-amber-500 border-amber-500/20" : "bg-white/5 text-white/20 hover:text-white/60"
                )}
              >
                <Clock size={18} weight="bold" />
              </button>
              <button 
                onClick={() => setIsCreatingChannel(true)}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:bg-blue-600 hover:text-white transition-all shadow-inner"
              >
                <PlusCircle size={20} weight="fill" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
             <div className="px-4 mb-4 mt-2">
                <div className="relative group">
                   <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10 group-focus-within:text-blue-500 transition-colors" weight="bold" />
                   <input placeholder="BUSCAR FRECUENCIA..." className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[9px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-white/5" />
                </div>
             </div>

            {!showArchived ? (
              channels.map(channel => (
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
                    <div className="flex items-center gap-2 mt-1">
                      <p className={cn("text-[9px] font-bold uppercase tracking-widest", activeChannel?.id === channel.id ? "text-white/40" : "text-white/10")}>Protocolo {channel.id.toUpperCase()}</p>
                      {mutedChannels.has(channel.id) && (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" title="Silenciado" />
                      )}
                    </div>
                  </div>
                  {channel.unread > 0 && activeChannel?.id !== channel.id && (
                    <div className="w-5 h-5 rounded-lg bg-blue-500 flex items-center justify-center text-[9px] font-black text-white shadow-lg shadow-blue-500/30">
                      {channel.unread}
                    </div>
                  )}
                </button>
              ))
            ) : (
              archivedChannels.length > 0 ? archivedChannels.map(channel => (
                <div 
                  key={channel.id}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-[1.5rem] bg-white/[0.01] border border-white/5 group"
                >
                   <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/10">
                      <Clock size={18} />
                   </div>
                   <div className="flex-1 text-left min-w-0">
                      <p className="text-xs font-black text-white/20 italic uppercase tracking-tighter truncate">{channel.name}</p>
                      <p className="text-[9px] font-bold text-white/5 uppercase tracking-widest mt-1 italic">Canal Archivado</p>
                   </div>
                   <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => restoreChannel(channel)}
                        className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center"
                        title="Restaurar"
                      >
                         <ShieldCheck size={16} weight="bold" />
                      </button>
                      <button 
                        onClick={() => permanentlyDeleteChannel(channel)}
                        className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                        title="Eliminar"
                      >
                         <X size={16} weight="bold" />
                      </button>
                   </div>
                </div>
              )) : (
                <div className="py-10 text-center opacity-10">
                   <Clock size={40} className="mx-auto mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em]">Archivo Vacío</p>
                </div>
              )
            )}
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
            <div className="flex items-center gap-2 relative">
               <div className="flex -space-x-3 mr-4">
                  {(employees.length > 0 ? employees.slice(0, 3) : [{ displayName: 'A' }, { displayName: 'B' }, { displayName: 'C' }]).map((emp, i) => (
                    <div 
                      key={i} 
                      title={emp.displayName}
                      className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 border-2 border-[#0d0d0f] flex items-center justify-center text-[10px] font-black text-white shadow-lg"
                    >
                       {emp.displayName?.charAt(0) || '?'}
                    </div>
                  ))}
               </div>
               
               <div className="relative">
                 <button 
                   onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                   className={cn(
                     "w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all border border-transparent hover:border-white/10",
                     showOptionsMenu && "bg-white/10 text-white border-white/10"
                   )}
                 >
                   <DotsThreeVertical weight="bold" size={24} />
                 </button>

                 <AnimatePresence>
                   {showOptionsMenu && (
                     <motion.div
                       initial={{ opacity: 0, y: 10, scale: 0.95 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       exit={{ opacity: 0, y: 10, scale: 0.95 }}
                       className="absolute top-full right-0 mt-3 w-56 bg-[#16161a] border border-white/10 rounded-[1.5rem] shadow-2xl backdrop-blur-xl z-[100] p-3 space-y-1"
                     >
                        <MenuOption 
                          icon={ShieldCheck} 
                          label="Info Frecuencia" 
                          color="blue" 
                          onClick={() => { setShowInfoModal(true); setShowOptionsMenu(false); }} 
                        />
                        <MenuOption 
                          icon={Broadcast} 
                          label={mutedChannels.has(activeChannel?.id) ? "Desactivar Silencio" : "Silenciar Canal"} 
                          onClick={toggleMute} 
                          color={mutedChannels.has(activeChannel?.id) ? "amber" : "white"}
                        />
                        <div className="h-px bg-white/5 my-2 mx-2" />
                        <MenuOption 
                          icon={X} 
                          label="Archivar Canal" 
                          color="rose" 
                          onClick={archiveChannel} 
                        />
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
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
                    className={cn("flex items-end gap-4 group/msg", isMe ? "flex-row-reverse" : "flex-row")}
                  >
                    {!isMe && (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg border border-white/5">
                        {msg.senderName.charAt(0)}
                      </div>
                    )}
                    <div className={cn("flex flex-col gap-2 relative", isMe ? "items-end" : "items-start")}>
                      <div className={cn(
                        "max-w-[480px] px-8 py-5 rounded-[2rem] text-sm leading-relaxed shadow-2xl relative",
                        isMe 
                          ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-none border border-white/10" 
                          : "bg-[#16161a] text-white/80 border border-white/5 rounded-tl-none backdrop-blur-sm"
                      )}>
                        {isMe && (
                          <button 
                            onClick={() => handleDeleteMessage(i)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover/msg:opacity-100 transition-all hover:bg-rose-600 shadow-lg backdrop-blur-sm z-30"
                          >
                            <X size={12} weight="bold" />
                          </button>
                        )}
                        {msg.attachment ? (
                          <div className="space-y-3">
                            {msg.attachment.isImage ? (
                              <img src={msg.attachment.url} alt="Adjunto" className="rounded-xl max-h-60 w-full object-cover border border-white/10" />
                            ) : (
                              <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-4">
                                <PaperclipHorizontal size={20} className="text-blue-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest truncate">{msg.attachment.name}</span>
                              </div>
                            )}
                            {msg.text && !msg.text.startsWith('Adjunto:') && <p>{msg.text}</p>}
                          </div>
                        ) : (
                          msg.text
                        )}
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
                 <button 
                   type="button" 
                   onClick={() => document.getElementById('chat-file-upload').click()}
                   className="text-white/10 hover:text-blue-500 transition-all active:scale-90"
                 >
                    <PaperclipHorizontal size={22} weight="bold" />
                 </button>
                 <input 
                   id="chat-file-upload"
                   type="file" 
                   className="hidden" 
                   onChange={handleFileUpload} 
                 />
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
                 <div className="relative">
                   <button 
                     type="button" 
                     onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                     className={cn("text-white/10 hover:text-amber-500 transition-all active:scale-90", showEmojiPicker && "text-amber-500")}
                   >
                      <Smiley size={24} weight="bold" />
                   </button>
                   
                   <AnimatePresence>
                     {showEmojiPicker && (
                       <motion.div 
                         initial={{ opacity: 0, y: 10, scale: 0.9 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 10, scale: 0.9 }}
                         className="absolute bottom-full right-0 mb-4 z-50 shadow-2xl"
                       >
                         <div className="rounded-3xl overflow-hidden border border-white/10 relative">
                            <button 
                              onClick={() => setShowEmojiPicker(false)}
                              className="absolute top-3 right-3 z-[60] w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-rose-500 transition-all shadow-lg"
                            >
                               <X size={16} weight="bold" />
                            </button>
                            <EmojiPicker 
                              theme={Theme.DARK}
                              onEmojiClick={addEmoji}
                              lazyLoadEmojis={true}
                              searchPlaceholder="BUSCAR EMOJI..."
                              width={320}
                              height={400}
                              skinTonesDisabled
                              previewConfig={{ showPreview: false }}
                            />
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>

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

      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="w-full max-w-md bg-[#0d0d0f] border border-white/10 rounded-[3rem] p-10 shadow-2xl overflow-hidden relative"
             >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                <button 
                  onClick={() => setShowInfoModal(false)}
                  className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all"
                >
                  <X size={20} weight="bold" />
                </button>

                <div className="flex items-center gap-4 mb-8">
                   <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                      <Hash size={32} weight="fill" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{activeChannel?.name}</h3>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-1">Frecuencia de Operaciones</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] border-b border-white/5 pb-4">Escuadrón Asignado</h4>
                   <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                      {employees.map((emp, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                           <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-[10px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/10">
                              {emp.displayName?.charAt(0)}
                           </div>
                           <div className="flex-1">
                              <p className="text-xs font-black text-white/60 uppercase tracking-tighter italic">{emp.displayName}</p>
                              <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-0.5">{emp.role}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <button 
                  onClick={() => setShowInfoModal(false)}
                  className="w-full mt-10 py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-600/20"
                >
                   Cerrar Expediente
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuOption({ icon: Icon, label, color = "white", onClick }) {
  const colors = {
    blue: "text-blue-500",
    rose: "text-rose-500",
    white: "text-white/40"
  };

  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group"
    >
      <Icon size={18} weight="bold" className={cn("transition-colors", colors[color], "group-hover:text-white")} />
      <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}
