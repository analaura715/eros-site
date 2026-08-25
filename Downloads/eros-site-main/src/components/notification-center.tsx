import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, Ticket, Calendar, X, CheckCheck, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AppNotification,
  globalNotifications,
  globalListeners,
  notifyListeners,
  pushNotification,
} from '@/lib/notifications';

// Re-export type only for backward compatibility (no value exports from component files)
export type { AppNotification };

interface NotificationCenterProps {
  onOpenChat?: () => void;
}

export function NotificationCenter({ onOpenChat }: NotificationCenterProps) {
  const { auth } = useStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  // Subscribe to global store
  useEffect(() => {
    const listener = (n: AppNotification[]) => setNotifications(n);
    globalListeners.push(listener);
    setNotifications([...globalNotifications]);
    return () => {
      const idx = globalListeners.indexOf(listener);
      if (idx !== -1) globalListeners.splice(idx, 1);
    };
  }, []);

  // Realtime: novos chamados
  useEffect(() => {
    if (!auth) return;

    const chamadoChannel = supabase
      .channel('notifications:chamados')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'suporte_chamados' }, (payload) => {
        pushNotification({
          type: 'chamado',
          title: '🎫 Novo Chamado Aberto',
          description: `${payload.new.empresa_nome || 'Um cliente'} — ${payload.new.titulo || 'Sem título'}`,
          link: '/suporte/chamados',
        });
        toast.info('Novo chamado aberto!', {
          description: payload.new.empresa_nome || 'Um cliente',
          duration: 6000,
        });
      })
      .subscribe();

    // Realtime: novas mensagens de chat
    const chatChannel = supabase
      .channel('notifications:chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_mensagens' }, async (payload) => {
        // Só notifica se não for mensagem do próprio usuário
        if (payload.new.usuario_id === auth.id) return;

        // Busca nome do remetente
        const { data: user } = await supabase
          .from('usuarios')
          .select('nome')
          .eq('id', payload.new.usuario_id)
          .single();

        const senderName = user?.nome || 'Alguém';

        pushNotification({
          type: 'mensagem',
          title: `💬 ${senderName}`,
          description: payload.new.tipo === 'texto'
            ? (payload.new.conteudo || 'Enviou uma mensagem')
            : payload.new.tipo === 'audio'
            ? '🎤 Mensagem de voz'
            : '📎 Arquivo',
        });
        toast.info(`${senderName} enviou uma mensagem`, {
          description: payload.new.tipo === 'texto' ? payload.new.conteudo : 'Arquivo ou áudio',
          duration: 5000,
          action: {
            label: 'Abrir',
            onClick: () => onOpenChat?.(),
          },
        });
      })
      .subscribe();

    // Realtime: reuniões (novas)
    const agendaChannel = supabase
      .channel('notifications:agenda')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agenda' }, (payload) => {
        pushNotification({
          type: 'reuniao',
          title: `📅 Reunião Agendada`,
          description: `${payload.new.titulo} — ${payload.new.tipo}`,
          link: '/comercial/agenda',
        });
      })
      .subscribe();

    // Solicitar permissão de notificação do browser
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(chamadoChannel);
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(agendaChannel);
    };
  }, [auth]);

  const markAllRead = () => {
    globalNotifications.forEach((n, i) => { globalNotifications[i] = { ...n, read: true }; });
    // Replace array reference
    const updated = globalNotifications.map(n => ({ ...n, read: true }));
    globalNotifications.length = 0;
    updated.forEach(n => globalNotifications.push(n));
    notifyListeners();
  };

  const removeNotification = (id: string) => {
    const idx = globalNotifications.findIndex(n => n.id === id);
    if (idx !== -1) globalNotifications.splice(idx, 1);
    notifyListeners();
  };

  const handleEnviarLembrete = (n: AppNotification) => {
    if (!n.lembretePayload) return;
    const { numeroCliente, mensagem } = n.lembretePayload;
    const encodedMsg = encodeURIComponent(mensagem);
    window.open(`https://api.whatsapp.com/send?phone=${numeroCliente}&text=${encodedMsg}`, '_blank');
    // Marcar como enviado
    const idx = globalNotifications.findIndex(notif => notif.id === n.id);
    if (idx !== -1) {
      globalNotifications[idx] = { ...globalNotifications[idx], lembreteEnviado: true, read: true };
    }
    notifyListeners();
  };

  const iconForType = (type: AppNotification['type']) => {
    if (type === 'mensagem') return <MessageSquare className="h-4 w-4 text-blue-500" />;
    if (type === 'chamado') return <Ticket className="h-4 w-4 text-orange-500" />;
    if (type === 'lembrete_cliente') return <Send className="h-4 w-4 text-emerald-600" />;
    return <Calendar className="h-4 w-4 text-indigo-500" />;
  };

  const bgForType = (type: AppNotification['type']) => {
    if (type === 'mensagem') return 'bg-blue-500/10';
    if (type === 'chamado') return 'bg-orange-500/10';
    if (type === 'lembrete_cliente') return 'bg-emerald-500/10';
    return 'bg-indigo-500/10';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-in zoom-in duration-200">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[380px] p-0 shadow-2xl rounded-2xl overflow-hidden border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
          <div>
            <h3 className="text-sm font-bold">Notificações</h3>
            {unread > 0 && (
              <p className="text-[11px] text-muted-foreground">{unread} não lida{unread > 1 ? 's' : ''}</p>
            )}
          </div>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground">
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar tudo
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="max-h-[420px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Tudo em dia!</p>
              <p className="text-xs text-muted-foreground mt-1">Nenhuma notificação nova por enquanto.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30 ${
                    !n.read
                      ? n.type === 'lembrete_cliente'
                        ? 'bg-emerald-500/5'
                        : 'bg-primary/5'
                      : ''
                  }`}
                >
                  <div className={`shrink-0 h-8 w-8 rounded-xl flex items-center justify-center mt-0.5 ${bgForType(n.type)}`}>
                    {iconForType(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[13px] leading-snug font-medium ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {n.title}
                      </p>
                      <span className="shrink-0 text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                        {formatDistanceToNow(n.time, { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{n.description}</p>

                    {/* Botão de ação exclusivo para lembrete de cliente */}
                    {n.type === 'lembrete_cliente' && n.lembretePayload && (
                      <div className="mt-2">
                        {n.lembreteEnviado ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                            <CheckCheck className="h-3 w-3" /> Enviado
                          </span>
                        ) : (
                          <button
                            onClick={() => handleEnviarLembrete(n)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors"
                          >
                            <Send className="h-3 w-3" />
                            Enviar WhatsApp
                          </button>
                        )}
                      </div>
                    )}

                    {!n.read && n.type !== 'lembrete_cliente' && (
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary mt-1.5"></span>
                    )}
                  </div>
                  <button
                    onClick={() => removeNotification(n.id)}
                    className="shrink-0 h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors mt-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
