import React, { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Send, Paperclip, ArrowLeft, Mic, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { AudioRecorder } from './audio-recorder';
import { toast } from 'sonner';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatDrawer({ open, onOpenChange }: ChatDrawerProps) {
  const { auth } = useStore();
  const [users, setUsers] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load all users to start chat
  useEffect(() => {
    if (open && auth) {
      const loadUsers = async () => {
        const { data } = await supabase.from('usuarios').select('*').neq('id', auth.id);
        if (data) setUsers(data);
      };
      loadUsers();
    }
  }, [open, auth]);

  // Load chat history + subscribe to realtime when activeChat changes
  useEffect(() => {
    if (!activeChat || !auth) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const loadAndSubscribe = async () => {
      // 1. Find existing conversation
      const { data: convData } = await supabase
        .from('chat_participantes')
        .select('conversa_id')
        .eq('usuario_id', auth.id);

      let conversaId: string | null = null;
      if (convData && convData.length > 0) {
        const convIds = convData.map(c => c.conversa_id);
        const { data: otherData } = await supabase
          .from('chat_participantes')
          .select('conversa_id')
          .eq('usuario_id', activeChat.id)
          .in('conversa_id', convIds);

        if (otherData && otherData.length > 0) {
          conversaId = otherData[0].conversa_id;
        }
      }

      if (conversaId) {
        activeChat.conversaId = conversaId;
        // 2. Load history
        const { data: msgs } = await supabase
          .from('chat_mensagens')
          .select('*')
          .eq('conversa_id', conversaId)
          .order('created_at', { ascending: true });
        setMessages(msgs || []);

        // 3. Subscribe realtime for this conversation
        channel = supabase
          .channel(`chat_conv_${conversaId}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_mensagens',
            filter: `conversa_id=eq.${conversaId}`,
          }, (payload) => {
            setMessages(prev => {
              // Avoid duplicates (optimistic messages already added)
              if (prev.find(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          })
          .subscribe();
      } else {
        setMessages([]);
      }
    };

    loadAndSubscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeChat?.id, auth?.id]);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSendMessage = async (tipo: 'texto' | 'audio' | 'imagem' | 'arquivo', conteudo: string, url_arquivo: string | null = null) => {
    if (!auth || !activeChat) return;

    let cId = activeChat.conversaId;

    if (!cId) {
      const { data: newConv, error: convError } = await supabase.from('chat_conversas').insert([{ tipo: 'direta' }]).select('id').single();
      if (newConv) {
        cId = newConv.id;
        activeChat.conversaId = cId;
        await supabase.from('chat_participantes').insert([
          { conversa_id: cId, usuario_id: auth.id },
          { conversa_id: cId, usuario_id: activeChat.id }
        ]);
      } else if (convError) {
        toast.error('Erro ao iniciar conversa. Tabela chat_conversas existe?');
        return;
      }
    }

    if (cId) {
      // Optimistic update — mostra mensagem imediatamente
      const tempMsg = {
        id: `temp_${Date.now()}`,
        conversa_id: cId,
        usuario_id: auth.id,
        tipo,
        conteudo,
        url_arquivo,
        created_at: new Date().toISOString(),
        _optimistic: true,
      };
      setMessages(prev => [...prev, tempMsg]);
      setInputText('');
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

      const { data: inserted, error } = await supabase.from('chat_mensagens').insert([{
        conversa_id: cId,
        usuario_id: auth.id,
        tipo,
        conteudo,
        url_arquivo
      }]).select().single();
      
      if (error) {
        // Rollback optimistic message
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        toast.error('Erro ao enviar mensagem.');
      } else if (inserted) {
        // Replace temp with real
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? inserted : m));
      }
    }
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${auth.id}/${fileName}`;

    toast.loading('Enviando arquivo...', { id: 'upload' });
    const { error } = await supabase.storage.from('chat_anexos').upload(filePath, file);

    if (error) {
      toast.error('Erro ao enviar arquivo', { id: 'upload' });
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('chat_anexos').getPublicUrl(filePath);
    
    toast.success('Arquivo enviado!', { id: 'upload' });
    const tipo = file.type.startsWith('image/') ? 'imagem' : 'arquivo';
    handleSendMessage(tipo, file.name, publicUrl);
  };

  const handleAudioComplete = async (blob: Blob) => {
    if (!auth) return;
    const fileName = `${Math.random()}.webm`;
    const filePath = `${auth.id}/${fileName}`;
    
    toast.loading('Enviando áudio...', { id: 'audio' });
    const { error } = await supabase.storage.from('chat_anexos').upload(filePath, blob, { contentType: 'audio/webm' });
    
    if (error) {
      toast.error('Erro ao enviar áudio', { id: 'audio' });
      setIsRecording(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('chat_anexos').getPublicUrl(filePath);
    toast.success('Áudio enviado!', { id: 'audio' });
    handleSendMessage('audio', 'Mensagem de voz', publicUrl);
    setIsRecording(false);
  };

  const filteredUsers = users.filter(u => u.nome?.toLowerCase().includes(search.toLowerCase()));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[500px] p-0 flex flex-col h-full bg-background border-l shadow-2xl">
        {!activeChat ? (
          <>
            <SheetHeader className="p-5 border-b bg-card/80 backdrop-blur-sm z-10 sticky top-0">
              <SheetTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">Chat Interno</SheetTitle>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar colega da equipe..."
                  className="pl-9 bg-muted/60 border-transparent focus-visible:ring-primary focus-visible:bg-background rounded-full h-10 transition-colors"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </SheetHeader>
            <ScrollArea className="flex-1 px-4 py-3 bg-slate-50/30 dark:bg-background">
              <div className="space-y-2">
                {filteredUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => setActiveChat(u)}
                    className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-white dark:hover:bg-card hover:shadow-sm transition-all border border-transparent hover:border-border text-left group"
                  >
                    <Avatar className="h-12 w-12 border-2 border-primary/10 shadow-sm transition-transform group-hover:scale-105">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-lg">{u.nome?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-base font-semibold truncate group-hover:text-primary transition-colors">{u.nome}</p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {u.perfil || u.cargo || 'Equipe'}
                      </p>
                    </div>
                  </button>
                ))}
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>Nenhum colega encontrado.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <>
            {/* Cabeçalho do Chat */}
            <header className="px-3 py-3 border-b flex items-center gap-3 bg-white/90 dark:bg-card/90 backdrop-blur-md shadow-sm z-20 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setActiveChat(null)} className="shrink-0 rounded-full h-10 w-10 hover:bg-muted transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3 flex-1 overflow-hidden cursor-pointer">
                <Avatar className="h-10 w-10 border shadow-sm">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">{activeChat.nome?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-sm font-bold leading-tight truncate">{activeChat.nome}</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate flex items-center gap-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
                  </span>
                </div>
              </div>
            </header>

            {/* Área de Mensagens com Pattern estilo WhatsApp */}
            <ScrollArea className="flex-1 bg-[#e5ddd5] dark:bg-[#0b141a] p-4 relative">
              {/* Pattern de fundo */}
              <div className="absolute inset-0 opacity-40 dark:opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg")', backgroundSize: '400px', backgroundRepeat: 'repeat' }}></div>
              
              <div className="flex flex-col gap-3 relative z-10">
                <div className="flex justify-center mb-6">
                  <div className="bg-white/80 dark:bg-card/80 backdrop-blur-sm text-[11px] font-medium px-3 py-1.5 rounded-xl shadow-sm border border-border/50 text-muted-foreground text-center max-w-[80%]">
                    As mensagens neste chat são criptografadas e protegidas para uso interno da equipe.
                  </div>
                </div>
                
                {messages.length === 0 && (
                   <div className="text-center text-sm text-muted-foreground mt-10">
                     Nenhuma mensagem ainda. Envie um "Olá"!
                   </div>
                )}

                {messages.map((msg, i) => {
                  const isMe = msg.usuario_id === auth?.id;
                  return (
                    <div key={msg.id || i} className={`flex max-w-[85%] ${isMe ? 'ml-auto justify-end' : 'mr-auto justify-start'} group`}>
                      <div className={`rounded-2xl px-3 pt-2 pb-1.5 text-[15px] shadow-sm relative ${
                        isMe 
                          ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-white rounded-tr-none' 
                          : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-white border-transparent rounded-tl-none'
                      }`}>
                        {/* Cauda do balão */}
                        <div className={`absolute top-0 w-3 h-3 ${isMe ? '-right-2 text-[#d9fdd3] dark:text-[#005c4b]' : '-left-2 text-white dark:text-[#202c33]'}`}>
                          <svg viewBox="0 0 8 13" width="8" height="13" className="fill-current"><path d={isMe ? "M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" : "M2.812 1H8v11.193L1.533 3.568C.474 2.156 1.042 1 2.812 1z"}></path></svg>
                        </div>

                        {msg.tipo === 'texto' && <p className="whitespace-pre-wrap break-words leading-snug mr-2">{msg.conteudo}</p>}
                        
                        {msg.tipo === 'imagem' && msg.url_arquivo && (
                          <div className="space-y-1 mb-1">
                            <a href={msg.url_arquivo} target="_blank" rel="noreferrer">
                              <img src={msg.url_arquivo} alt="Anexo" className="rounded-xl max-w-[240px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                            </a>
                          </div>
                        )}
                        
                        {msg.tipo === 'arquivo' && msg.url_arquivo && (
                          <a href={msg.url_arquivo} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 bg-black/5 dark:bg-white/5 rounded-xl text-sm font-medium hover:bg-black/10 transition-colors mb-1">
                            <div className={`p-2.5 rounded-full ${isMe ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-300' : 'bg-primary/20 text-primary'}`}>
                              <Paperclip className="h-4 w-4" />
                            </div> 
                            <span className="truncate max-w-[160px]">{msg.conteudo}</span>
                          </a>
                        )}

                        {msg.tipo === 'audio' && msg.url_arquivo && (
                          <div className="py-1 min-w-[200px]">
                            <audio src={msg.url_arquivo} controls className={`h-10 w-full ${isMe ? 'opacity-90' : 'opacity-100'}`} />
                          </div>
                        )}
                        
                        <div className={`text-[10px] mt-0.5 text-right flex items-center justify-end gap-1 ${isMe ? 'text-black/50 dark:text-white/60' : 'text-muted-foreground'}`}>
                          {format(new Date(msg.created_at), 'HH:mm')}
                          {isMe && <CheckCircle2 className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} className="h-2" />
              </div>
            </ScrollArea>

            {/* Input Área estilo WhatsApp */}
            <div className="p-3 bg-card border-t shrink-0">
              {isRecording ? (
                <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl p-2 border border-red-200 dark:border-red-900/50">
                  <AudioRecorder 
                    onRecordingComplete={handleAudioComplete} 
                    onCancel={() => setIsRecording(false)} 
                  />
                </div>
              ) : (
                <form 
                  onSubmit={(e) => { e.preventDefault(); if (inputText.trim()) handleSendMessage('texto', inputText.trim()); }}
                  className="flex items-end gap-2"
                >
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  
                  <div className="flex bg-muted/50 dark:bg-muted/30 rounded-3xl p-1.5 flex-1 shadow-inner focus-within:ring-1 focus-within:ring-primary/30 transition-all items-end min-h-[44px]">
                    <Button type="button" variant="ghost" size="icon" className="shrink-0 h-9 w-9 rounded-full text-muted-foreground hover:text-foreground mb-0.5 ml-0.5" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    
                    <textarea 
                      value={inputText}
                      onChange={(e) => {
                        setInputText(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = (e.target.scrollHeight < 120 ? e.target.scrollHeight : 120) + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (inputText.trim()) handleSendMessage('texto', inputText.trim());
                        }
                      }}
                      placeholder="Digite uma mensagem..." 
                      className="border-0 bg-transparent shadow-none focus-visible:ring-0 flex-1 px-3 py-2 text-[15px] resize-none overflow-y-auto max-h-[120px] outline-none placeholder:text-muted-foreground/70"
                      rows={1}
                      style={{ height: 'auto', minHeight: '40px' }}
                    />
                  </div>
                  
                  {inputText.trim() ? (
                    <Button type="submit" size="icon" className="h-11 w-11 rounded-full shrink-0 shadow-md bg-emerald-600 hover:bg-emerald-700 text-white transition-all transform active:scale-95 mb-0.5">
                      <Send className="h-5 w-5 ml-1" />
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      size="icon" 
                      className="h-11 w-11 rounded-full shrink-0 shadow-md bg-emerald-600 hover:bg-emerald-700 text-white transition-all transform active:scale-95 mb-0.5"
                      onClick={() => setIsRecording(true)}
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                  )}
                </form>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
