// Armazena notificações em memória entre renders (singleton global)
export interface LembretePayload {
  numeroCliente: string;
  mensagem: string;
  empresa: string;
}

export interface AppNotification {
  id: string;
  type: 'mensagem' | 'chamado' | 'reuniao' | 'lembrete_cliente';
  title: string;
  description: string;
  time: Date;
  read: boolean;
  link?: string;
  lembretePayload?: LembretePayload;
  lembreteEnviado?: boolean;
}

export let globalNotifications: AppNotification[] = [];
export let globalListeners: Array<(n: AppNotification[]) => void> = [];

export function notifyListeners() {
  globalListeners.forEach(l => l([...globalNotifications]));
}

export function pushNotification(n: Omit<AppNotification, 'id' | 'read' | 'time'>) {
  const notification: AppNotification = {
    ...n,
    id: crypto.randomUUID(),
    read: false,
    time: new Date(),
  };
  globalNotifications = [notification, ...globalNotifications].slice(0, 50);
  notifyListeners();

  // Browser notification (se permitido)
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(n.title, { body: n.description, icon: '/favicon.ico' });
  }
}
