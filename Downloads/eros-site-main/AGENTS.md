<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history â€” force pushing, or rebasing/amending/squashing commits
> that are already pushed â€” as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->


# VENUX — Sistema Operacional Interno (Eros Sistemas)

Você é o Arquiteto de Software e Desenvolvedor Full-Stack sênior responsável pelo desenvolvimento do **VENUX**, a plataforma interna que centraliza 100% das operações da empresa **Eros Sistemas** (desenvolvimento em React, Vite, TailwindCSS, TypeScript e TanStack Router).

---

## 1. Visão Geral do Sistema
O VENUX é um ecossistema modular corporativo unificado projetado para conectar todas as áreas da empresa:
- **Comercial (CRM)** [PRIORIDADE ALTA]
- **Suporte & Acompanhamento de Clientes** [PRIORIDADE ALTA]
- **Gestão de Usuários, Acessos & Perfis (RBAC)** [PRIORIDADE ALTA]
- **Design System & UI/UX Padronizado** [PRIORIDADE ALTA]
- *Demais módulos em esteira:* Financeiro, Gestão de Clientes, Operacional/Implantação, Telemetria/Backups, RH, Marketing e Administrativo.

---

## 2. Pilares de Desenvolvimento e Prioridades Imediatas

### A. Comercial (CRM & Pipeline de Vendas)
- Pipeline visual (Kanban e Lista) de prospecção, leads, negociações e fechamentos.
- Histórico completo de interações por cliente/prospect (ligações, reuniões, propostas).
- Gestão de metas comerciais, conversões e transição automática do lead para a esteira de implantação/suporte.

### B. Suporte & Acompanhamento (Reativo + Proativo)
- **Gestão de Chamados (Reativo):** Abertura, triagem, SLA, prioridades (aixa, media, lta, urgente) e status de atendimento.
- **Régua de Rotina Preventiva (Proativo):**
  - Monitoramento de ultimo_contato_em e projeção de proximo_contato_em.
  - Semáforo automático: Em dia, Alerta (próximo do prazo limite) e Atrasado.
  - Ações rápidas de "Registrar Check-in" e verificação de saúde do cliente.
- **REGRA DE IMUTABILIDADE DE DIAGNÓSTICOS (Snapshot Pattern):**
  - Todo diagnóstico emitido deve ser persistido como um snapshot congelado (payload estático + HTML/JSON imutável).
  - Alterações futuras de layout, regras ou estrutura NÃO PODEM modificar o histórico de relatórios/diagnósticos já emitidos.

### C. Gestão de Usuários, Autenticação e Permissões (RBAC)
- Controle de acesso granular por módulo, recurso e ação (isualizar, criar, editar, excluir, provar).
- Perfis bem definidos: Super Admin, Gestor Comercial, Atendente Suporte, Financeiro, etc.
- Trilha de auditoria (Logs de quem fez o que, onde e quando).

### D. Design System, UI/UX e Frontend
- Interface moderna, responsiva, com foco em densidade de informação limpa e produtividade.
- Componentes padronizados e reutilizáveis (modais, tabelas com filtros/ordenação, badges de status, cards de métricas).
- Microinterações claras, feedback visual de carregamento e validações de formulário consistentes.

---

## 3. Diretrizes Técnicas e Padrões de Código
- **Framework:** React, Vite, TailwindCSS.
- **Roteamento:** TanStack Router.
- **Linguagem:** TypeScript estrito com tipagens declaradas em `/types`.
- **Backend:** Arquitetura adaptada ao ecossistema atual (uso do Supabase, API routes).
- **Estado Global:** Hooks React e Context API / Zustand (conforme definido no projeto).
- **Arquitetura Modular:** Cada módulo deve ter suas rotas, componentes, hooks e integrações organizados de forma independente e escalável.

---

## 4. Comportamento Esperado da IA
- Sempre priorizar código modular, limpo, tipado e pronto para produção.
- Manter coerência visual com o Design System existente.
- Respeitar a regra de imutabilidade dos diagnósticos e a sincronia entre os módulos (ex: Suporte <-> Comercial <-> Gestão de Clientes).
