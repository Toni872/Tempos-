import React, { useState } from 'react';
import { 
  ChatTeardrop, 
  PaperPlaneRight, 
  Hash, 
  User, 
  MagnifyingGlass, 
  DotsThreeVertical,
  PlusCircle,
  Clock,
  X
} from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import Card, { CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function MensajesTab({ profile }) {
  const [channels, setChannels] = useState([
    { id: 'gen', name: 'General', type: 'channel' },
    { id: 'sop', name: 'Soporte Técnico', type: 'channel' },
    { id: 'adm', name: 'Administración', type: 'channel' }
  ]);
  const [activeChannel, setActiveChannel] = useState(channels[0]);
  const [messagesByChannel, setMessagesByChannel] = useState({
    'gen': [
      { senderName: 'Soporte Tempos', text: 'Bienvenido al canal general.', senderId: 'system' }
    ]
  });
  const [newMessage, setNewMessage] = useState('');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  const currentMessages = messagesByChannel[activeChannel?.id] || [];

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel) return;
    
    const msg = {
      senderName: profile?.displayName || 'Tú',
      text: newMessage,
      senderId: 'me',
      isMe: true
    };

    setMessagesByChannel(prev => ({
      ...prev,
      [activeChannel.id]: [...(prev[activeChannel.id] || []), msg]
    }));
    setNewMessage('');
  };

  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    const newChan = { id: Date.now().toString(), name: newChannelName, type: 'channel' };
    setChannels(prev => [...prev, newChan]);
    setActiveChannel(newChan);
    setNewChannelName('');
    setIsCreatingChannel(false);
  };

  const handleDeleteChannel = (id) => {
    if (channels.length <= 1) return;
    const filtered = channels.filter(c => c.id !== id);
    setChannels(filtered);
    if (activeChannel?.id === id) setActiveChannel(filtered[0]);
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col gap-6">
      <SectionHeader 
        icon={ChatTeardrop}
        title="Canales de Comunicación"
        subtitle="Conversaciones en tiempo real con el equipo y departamentos."
      />

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Sidebar de Canales */}
        <Card className="w-80 flex flex-col shrink-0">
          <div className="p-5 border-b border-white/[0.04] flex items-center justify-between">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Canales y Chats</h3>
            <button 
              onClick={() => setIsCreatingChannel(true)}
              className="text-zinc-500 hover:text-blue-500 transition-colors"
            >
              <PlusCircle className="w-5 h-5" weight="duotone" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
            {isCreatingChannel && (
              <form onSubmit={handleCreateChannel} className="px-2 py-2 mb-2 animate-tp-fade-in">
                <input 
                  autoFocus
                  placeholder="Nombre del canal..."
                  className="w-full bg-white/[0.03] border border-blue-500/30 rounded-lg p-2 text-xs text-white outline-none"
                  value={newChannelName}
                  onChange={e => setNewChannelName(e.target.value)}
                  onBlur={() => !newChannelName && setIsCreatingChannel(false)}
                />
              </form>
            )}
            {channels.map(channel => (
              <div key={channel.id} className="group relative">
                <button
                  onClick={() => setActiveChannel(channel)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    activeChannel?.id === channel.id 
                      ? "bg-blue-600 text-white" 
                      : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    activeChannel?.id === channel.id ? "bg-white/20" : "bg-white/[0.03] group-hover:bg-white/[0.08]"
                  )}>
                    {channel.type === 'direct' ? <User weight="bold" className="w-4 h-4" /> : <Hash weight="bold" className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-bold truncate">{channel.name}</p>
                    <p className={cn(
                      "text-[10px] truncate",
                      activeChannel?.id === channel.id ? "text-blue-100" : "text-zinc-600"
                    )}>Click para chatear</p>
                  </div>
                </button>
                {channels.length > 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteChannel(channel.id); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-rose-400 transition-all"
                  >
                    <X className="w-3.5 h-3.5" weight="bold" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Ventana de Chat */}
        <Card className="flex-1 flex flex-col min-w-0">
          <div className="p-5 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.01]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                {activeChannel?.type === 'direct' ? <User weight="duotone" className="w-5 h-5" /> : <Hash weight="duotone" className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-black text-white">{activeChannel?.name || 'Selecciona un canal'}</h4>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest">En línea ahora</span>
                </div>
              </div>
            </div>
            <button className="p-2 text-zinc-600 hover:text-white transition-colors">
              <DotsThreeVertical weight="bold" className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-[#0a0a0c] border-x border-white/[0.04]">
            <AnimatePresence initial={false}>
              {currentMessages.length > 0 ? currentMessages.map((msg, i) => {
                const isMe = msg.isMe || msg.senderId === 'me';
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    key={i} 
                    className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                  >
                    <div className={cn(
                      "max-w-[70%] px-5 py-3.5 rounded-3xl text-sm leading-relaxed shadow-lg",
                      isMe 
                        ? "bg-blue-600 text-white rounded-tr-sm shadow-blue-600/20" 
                        : "bg-[#16161a] text-zinc-200 border border-white/[0.05] rounded-tl-sm"
                    )}>
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 px-2 opacity-60">
                       <span className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">{msg.senderName}</span>
                       <span className="text-[9px] font-black text-zinc-600">•</span>
                       <span className="text-[9px] font-mono text-zinc-500">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <ChatTeardrop className="w-20 h-20 mb-4" weight="duotone" />
                  <p className="text-sm font-black uppercase tracking-widest">No hay mensajes todavía</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          <form onSubmit={handleSend} className="p-5 border-t border-white/[0.04] bg-white/[0.01]">
            <div className="relative group">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje aquí..."
                className="w-full bg-[#0a0a0c] border border-white/[0.06] rounded-2xl py-4 pl-6 pr-16 text-sm focus:outline-none focus:border-blue-500/40 transition-all font-medium text-zinc-200"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="absolute right-2 top-2 bottom-2 w-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed active:scale-95"
              >
                <PaperPlaneRight weight="fill" className="w-5 h-5" />
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
