import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Ticket, RotinaContato, DiagnosticoSnapshot, StatusRotina } from '@/types/suporte';
import { differenceInDays, parseISO } from 'date-fns';

export interface ConfigItem {
  id: string;
  nome: string;
  cor: string;
  cor_texto?: string;
  icone?: string;
}

export interface SuporteConfiguracoes {
  id?: string;
  tipos_ticket: ConfigItem[];
  setores: ConfigItem[];
  modulos: ConfigItem[];
  modulos_venux: ConfigItem[];
}

export interface ActiveTicket {
  id: string;
  empresa_id: string;
  empresa_nome: string;
  contato: string;
  responsavel: string;
  start_time: number;
}

export function useSuporte() {
  const [loading, setLoading] = useState(false);

  // -- CHAMADOS --
  
  const fetchChamados = useCallback(async (): Promise<Ticket[]> => {
    setLoading(true);
    const { data, error } = await supabase
      .from('suporte_chamados')
      .select('*, empresa:empresas(id, nome)')
      .order('created_at', { ascending: false });
    
    setLoading(false);
    if (error) {
      console.error("Erro ao buscar chamados:", error);
      return [];
    }
    return data as Ticket[];
  }, []);

  const createChamado = useCallback(async (ticketData: Partial<Ticket>) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('suporte_chamados')
      .insert([ticketData])
      .select('*, empresa:empresas(id, nome)')
      .single();
    
    setLoading(false);
    if (error) throw error;
    return data as Ticket;
  }, []);

  const updateChamado = useCallback(async (id: string, updates: Partial<Ticket>) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('suporte_chamados')
      .update(updates)
      .eq('id', id)
      .select('*, empresa:empresas(id, nome)')
      .single();
      
    setLoading(false);
    if (error) throw error;
    return data as Ticket;
  }, []);

  // -- ACTIVE TICKET (LOCAL STORAGE & REALTIME) --
  
  const getActiveTicket = useCallback((): ActiveTicket | null => {
    const stored = localStorage.getItem('venux_active_ticket');
    return stored ? JSON.parse(stored) : null;
  }, []);

  const startActiveTicket = useCallback((ticket: ActiveTicket) => {
    localStorage.setItem('venux_active_ticket', JSON.stringify(ticket));
  }, []);

  const clearActiveTicket = useCallback(() => {
    localStorage.removeItem('venux_active_ticket');
  }, []);

  const broadcastTicketStarted = useCallback(async (ticket: ActiveTicket) => {
    const channel = supabase.channel('suporte_notifications');
    await channel.send({
      type: 'broadcast',
      event: 'ticket_started',
      payload: ticket,
    });
  }, []);

  const subscribeToTicketNotifications = useCallback((callback: (payload: ActiveTicket) => void) => {
    const channel = supabase.channel('suporte_notifications');
    channel
      .on(
        'broadcast',
        { event: 'ticket_started' },
        (event) => callback(event.payload as ActiveTicket)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // -- ROTINA DE CONTATOS --
  
  const fetchRotinas = useCallback(async (empresaId: string): Promise<RotinaContato[]> => {
    setLoading(true);
    const { data, error } = await supabase
      .from('suporte_rotinas_contato')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('data_contato', { ascending: false });
      
    setLoading(false);
    if (error) {
      console.error("Erro ao buscar rotinas:", error);
      return [];
    }
    return data as RotinaContato[];
  }, []);

  const registrarCheckin = useCallback(async (empresaId: string, tipoInteracao: string, notas: string) => {
    setLoading(true);
    try {
      // 1. Inserir o log de rotina
      const { data, error } = await supabase
        .from('suporte_rotinas_contato')
        .insert([{ empresa_id: empresaId, tipo_interacao: tipoInteracao, notas }])
        .select()
        .single();
        
      if (error) throw error;

      // 2. Atualizar ultimo_contato_em na empresa
      const { error: empError } = await supabase
        .from('empresas')
        .update({ ultimo_contato_em: new Date().toISOString() })
        .eq('id', empresaId);

      if (empError) throw empError;

      return data as RotinaContato;
    } finally {
      setLoading(false);
    }
  }, []);

  // -- SNAPSHOTS --
  
  const fetchSnapshot = useCallback(async (diagnosticoId: string): Promise<DiagnosticoSnapshot | null> => {
    const { data, error } = await supabase
      .from('diagnosticos_snapshots')
      .select('*')
      .eq('diagnostico_id', diagnosticoId)
      .maybeSingle();
      
    if (error) {
      console.error("Erro ao buscar snapshot:", error);
      return null;
    }
    return data as DiagnosticoSnapshot | null;
  }, []);

  const congelarDiagnostico = useCallback(async (diagnosticoId: string, payloadEstatico: any, usuarioNome: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('diagnosticos_snapshots')
      .insert([{
        diagnostico_id: diagnosticoId,
        payload_estatico: payloadEstatico,
        congelado_por: usuarioNome,
        versao: '1.0'
      }])
      .select()
      .single();
      
    setLoading(false);
    if (error) throw error;
    return data as DiagnosticoSnapshot;
  }, []);

  // -- CONFIGURAÇÕES --
  // Helper para garantir que todos os itens são objetos {id, nome, cor}
  const normalizeConfigList = (items: any[] | null | undefined): ConfigItem[] => {
    if (!items || !Array.isArray(items)) return [];
    const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];
    return items.map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: crypto.randomUUID(),
          nome: item,
          cor: colors[index % colors.length]
        };
      }
      return item as ConfigItem;
    });
  };

  const fetchConfiguracoes = useCallback(async (): Promise<SuporteConfiguracoes | null> => {
    const { data, error } = await supabase
      .from('suporte_configuracoes')
      .select('*')
      .limit(1)
      .maybeSingle();

    const defaultSettings: SuporteConfiguracoes = {
      tipos_ticket: normalizeConfigList(["Bug / Erro", "Dúvida de Uso", "Melhoria", "Acesso / Permissão", "Treinamento", "Implantação", "Outros"]),
      setores: normalizeConfigList(["Suporte N1", "Suporte N2", "Infraestrutura", "Desenvolvimento", "Comercial"]),
      modulos: normalizeConfigList(["Financeiro", "Relatórios", "Autenticação", "Estoque", "Vendas"]),
      modulos_venux: normalizeConfigList(["Comercial", "Suporte", "Usuários"])
    };

    const processConfig = (raw: any): SuporteConfiguracoes => {
      const config = {
        ...raw,
        tipos_ticket: normalizeConfigList(raw.tipos_ticket || defaultSettings.tipos_ticket),
        setores: normalizeConfigList(raw.setores || defaultSettings.setores),
        modulos: normalizeConfigList(raw.modulos || defaultSettings.modulos),
        modulos_venux: normalizeConfigList(raw.modulos_venux)
      };

      // Ensure modulos_venux has defaults if completely empty
      if (!config.modulos_venux || config.modulos_venux.length === 0) {
        config.modulos_venux = defaultSettings.modulos_venux;
      }
      return config as SuporteConfiguracoes;
    };

    if (error) {
      console.error("Erro ao buscar configurações do suporte (possivelmente a tabela não existe):", error);
      const local = localStorage.getItem('fallback_suporte_config');
      if (local) {
        return processConfig(JSON.parse(local));
      }
      return defaultSettings;
    }

    if (!data) {
      const local = localStorage.getItem('fallback_suporte_config');
      if (local) {
        return processConfig(JSON.parse(local));
      }
      return defaultSettings;
    }

    return processConfig(data);
  }, []);

  const updateConfiguracoes = useCallback(async (updates: Partial<SuporteConfiguracoes>) => {
    setLoading(true);
    const config = await fetchConfiguracoes();
    const isNew = !config?.id;
    
    let res;
    if (isNew) {
      res = await supabase.from('suporte_configuracoes').insert([updates]).select().single();
    } else {
      res = await supabase.from('suporte_configuracoes').update(updates).eq('id', config.id).select().single();
    }
    
    setLoading(false);
    if (res.error) {
      console.warn("Salvando localmente como fallback. Erro DB:", res.error.message);
      const updatedLocal = { ...config, ...updates };
      localStorage.setItem('fallback_suporte_config', JSON.stringify(updatedLocal));
      return updatedLocal;
    }
    return res.data;
  }, [fetchConfiguracoes]);

  // -- UTILITÁRIOS --

  const calcularStatusRotina = (ultimoContatoISO: string | null | undefined, diasCadencia: number = 30): StatusRotina => {
    if (!ultimoContatoISO) return "Sem contato";
    
    const diasPassados = differenceInDays(new Date(), parseISO(ultimoContatoISO));
    const diasRestantes = diasCadencia - diasPassados;

    if (diasRestantes < 0) return "Atrasado";
    if (diasRestantes <= 5) return "Alerta";
    return "Em dia";
  };

  // -- PENDÊNCIAS / BACKLOG --
  
  const fetchPendencias = useCallback(async (): Promise<any[]> => {
    setLoading(true);
    const { data, error } = await supabase
      .from('venux_pendencias')
      .select('*, cliente:empresas(id, nome)')
      .order('created_at', { ascending: false });
      
    setLoading(false);
    if (error) {
      console.error("Erro ao buscar pendências:", error);
      return [];
    }
    return data;
  }, []);

  const createPendencia = useCallback(async (pendenciaData: any) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('venux_pendencias')
      .insert([pendenciaData])
      .select()
      .single();
      
    setLoading(false);
    if (error) throw error;
    return data;
  }, []);

  const updatePendencia = useCallback(async (id: string, updates: any) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('venux_pendencias')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    setLoading(false);
    if (error) throw error;
    return data;
  }, []);

  // -- UPLOAD DE IMAGENS --
  const uploadImagensChamado = useCallback(async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chamados_imagens')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Erro no upload de imagem:", uploadError);
        continue;
      }

      const { data } = supabase.storage.from('chamados_imagens').getPublicUrl(filePath);
      if (data?.publicUrl) urls.push(data.publicUrl);
    }
    return urls;
  }, []);

  return {
    loading,
    fetchChamados,
    createChamado,
    updateChamado,
    uploadImagensChamado,
    fetchRotinas,
    registrarCheckin,
    fetchSnapshot,
    congelarDiagnostico,
    fetchConfiguracoes,
    updateConfiguracoes,
    calcularStatusRotina,
    fetchPendencias,
    createPendencia,
    updatePendencia,
    getActiveTicket,
    startActiveTicket,
    clearActiveTicket,
    broadcastTicketStarted,
    subscribeToTicketNotifications
  };
}
