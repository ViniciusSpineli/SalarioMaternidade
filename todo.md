# Controle Salário-Maternidade - TODO

## Banco de Dados
- [x] Definir schema com tabelas: clientes, gps, honorarios, checklist_documentos, tarefas_urgentes
- [x] Criar migrations e aplicar ao banco

## Autenticação
- [x] Configurar OAuth Manus (template já implementado)
- [x] Implementar contexto de usuário com nome e foto de perfil (template)
- [x] Exibir dados do usuário na sidebar (DashboardLayout)

## Backend (tRPC)
- [x] Procedures para CRUD de clientes
- [x] Procedures para GPS (listar, marcar como paga, calcular competência)
- [x] Procedures para Honorários (registrar cobrança, listar por status)
- [x] Procedures para Urgências (listar, atualizar checklist)
- [x] Procedures para Relatórios (filtrar, exportar CSV)

## Frontend - Layout
- [x] Implementar DashboardLayout com sidebar e topbar (template)
- [x] Configurar navegação entre telas
- [x] Estilização profissional e responsiva

## Frontend - Dashboard
- [x] Cards estatísticos (clientes ativas, GPS a gerar, urgentes, honorários pendentes)
- [x] Painel de alertas ativos
- [x] Atualização em tempo real

## Frontend - Kanban
- [x] 15 colunas com etapas do fluxo
- [x] Cards de clientes com informações resumidas
- [x] Clique para abrir painel de detalhes

## Frontend - Clientes
- [x] Tabela de clientes com busca e filtros
- [x] Modal de cadastro com cálculos automáticos
- [x] Painel lateral de detalhes com progresso e checklist
- [x] Ações contextuais por etapa

## Frontend - GPS/Pagamentos
- [x] Abas: A Gerar, Pend. Pagamento, Pagas, Todas
- [x] Resumo por competência
- [x] Tabela com funcionalidade de marcação de GPS como paga

## Frontend - Urgências
- [x] Listagem de clientes em urgência absoluta
- [x] Checklist de tarefas dedicado
- [x] Marcação de tarefas como concluídas

## Frontend - Honorários
- [x] Abas: Pendentes, Boletos, Recebidos, Inadimplentes
- [x] Modal de registro de cobrança com parcelamento
- [x] Tabela com ações de marcação de recebimento/inadimplência

## Frontend - Relatórios
- [x] Filtros por origem e status
- [x] Tabela detalhada de clientes
- [x] Exportação CSV com BOM UTF-8

## Testes
- [x] Testes unitários para procedures críticas (9 testes passando)
- [x] Validação de fluxo completo

## Deploy
- [x] Criar checkpoint final (version: fe2f5995)
- [x] Validar funcionalidades em produção


## Novas Funcionalidades - Fase 2

### Login e Cadastro de Usuários
- [x] Criar tabela de usuários com campos: email, senha (hash), nome, role (admin/user), ativo
- [x] Implementar procedures tRPC para login, cadastro e validação
- [x] Criar página de login com formulário
- [x] Criar página de cadastro com validação
- [x] Definir Steffany Tavares como administrador principal (steffany.tavares@admin.com / 12345)
- [x] Implementar proteção de rotas baseada em role

### Barra de Pesquisa Global
- [x] Criar componente de barra de pesquisa no topbar
- [x] Implementar procedure tRPC para buscar clientes por nome ou CPF
- [x] Integrar busca em tempo real com debounce (300ms)
- [x] Exibir resultados em dropdown com navegação rápida

### Gráfico de Honorários
- [x] Criar procedure tRPC para agregar dados de honorários por mês
- [x] Implementar gráfico de linha/coluna com Recharts
- [x] Mostrar evolução mensal (últimos 12 meses)
- [x] Diferenciar honorários recebidos vs pendentes


## Correção - Simplificação de Autenticação

- [x] Remover páginas Login.tsx e formulários de cadastro
- [x] Remover router authLocal de procedures tRPC (não mais usado)
- [x] Criar acesso fixo apenas para Steffany Tavares (usuário: "Steffany Tavares")
- [x] Remover proteção de rotas baseada em localStorage
- [x] Testar acesso direto ao Dashboard


## Filtros de Período no Dashboard

- [x] Criar procedures tRPC para agregar dados por mês, trimestre e ano
- [x] Atualizar GraficoHonorarios com seletor de período
- [x] Adicionar cards de resumo com filtros no Dashboard
- [x] Testar filtros com dados reais


## Sistema de Metas de Honorários

- [x] Criar tabela de metas no banco de dados
- [x] Implementar procedures tRPC para CRUD de metas
- [x] Criar componente CardMeta com indicador visual (verde/amarelo/vermelho)
- [x] Adicionar card de meta ao Dashboard
- [x] Implementar modal para editar/criar metas
- [x] Testar sistema de metas completo
