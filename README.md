# 🤱 Controle de Salário-Maternidade

> Sistema de gestão de clientes e acompanhamento de processos de **salário-maternidade** — do primeiro contato à concessão do benefício pelo INSS.

Uma aplicação **full-stack** construída para organizar o fluxo de trabalho de um escritório: cadastro de clientes, controle de documentos, GPS/pagamentos, honorários, urgências e relatórios — tudo em um painel único, com quadro Kanban visual e dashboard de indicadores.

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" />
  <img alt="tRPC" src="https://img.shields.io/badge/tRPC-11-2596BE?logo=trpc&logoColor=white" />
  <img alt="SQLite" src="https://img.shields.io/badge/SQLite-Drizzle_ORM-003B57?logo=sqlite&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green" />
</p>

---

## 📸 Preview

### 🔐 Tela de Login

<p align="center">
  <img alt="Tela de login do Controle de Salário-Maternidade" src="docs/login.png" width="100%" />
</p>

### 📊 Dashboard

<p align="center">
  <img alt="Dashboard com indicadores e resumo de honorários" src="docs/dashboard.png" width="100%" />
</p>

---

## ✨ Funcionalidades

- 📊 **Dashboard** com estatísticas, indicadores e alertas em tempo real
- 📋 **Kanban** com as etapas do fluxo de processo, arrastar e soltar
- 👥 **Gestão de Clientes** — cadastro, edição, exclusão e filtros por status
- 🗂️ **Checklist de documentos** por cliente
- 💰 **Controle de GPS / Pagamentos**
- 🧾 **Honorários** com histórico e evolução ao longo do tempo
- 🚨 **Tarefas urgentes** e acompanhamento de prazos
- 🎯 **Metas** de honorários com indicadores visuais de progresso
- 📈 **Relatórios** com gráficos e exportação para **CSV**
- 🔍 **Busca global** em toda a base de clientes
- 📅 **Filtros por período** (mês, trimestre, ano)
- 🔐 **Login** com autenticação por sessão (JWT)

### Etapas de status do processo

`📄 Aguardando assinatura` → `📑 Aguardando certidão` → `🕒 Em análise INSS` → `⚖️ Em recurso INSS` → `✅ Benefício concedido` → `👥 Cliente ativa` / `🚫 Cliente inativa`

---

## 🛠️ Tecnologias

| Camada        | Stack                                                                 |
| ------------- | --------------------------------------------------------------------- |
| **Frontend**  | React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI, Framer Motion   |
| **Estado/API**| tRPC 11, TanStack Query, Wouter (rotas), Zod (validação)              |
| **Backend**   | Node.js, Express, tRPC Server                                         |
| **Banco**     | SQLite (better-sqlite3) + Drizzle ORM                                 |
| **Gráficos**  | Recharts                                                              |
| **Ferramentas**| pnpm, ESBuild, Vitest, Prettier                                      |

---

## 🚀 Começando

### Pré-requisitos

- [Node.js](https://nodejs.org/) **v18 ou superior**
- [pnpm](https://pnpm.io/) (instalado automaticamente se necessário)

> 💡 **Não precisa instalar banco de dados.** O sistema usa SQLite, um arquivo local
> (`data/controle.db`) criado automaticamente na primeira execução.

### Instalação

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd controle-maternidade-site

# 2. Instale as dependências
pnpm install

# 3. Crie o arquivo .env.local (veja o exemplo abaixo)
cp .env.local.example .env.local

# 4. Inicie o servidor de desenvolvimento
pnpm dev
```

O sistema abrirá em **http://localhost:3000**

> No Windows, você também pode dar um duplo clique em `INICIAR.bat`.

### Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
DATABASE_URL="file:./data/controle.db"
JWT_SECRET="sua_chave_secreta_muito_longa_com_mais_de_32_caracteres"
VITE_APP_TITLE="Controle Salário-Maternidade"
```

> ⚠️ **Nunca** faça commit do arquivo `.env.local` com segredos reais — ele já está no `.gitignore`.

---

## 📜 Scripts disponíveis

| Comando          | Descrição                                              |
| ---------------- | ------------------------------------------------------ |
| `pnpm dev`       | Inicia o servidor de desenvolvimento (client + server) |
| `pnpm build`     | Gera a build de produção                               |
| `pnpm start`     | Executa a build de produção                            |
| `pnpm check`     | Verificação de tipos com TypeScript                    |
| `pnpm test`      | Roda os testes com Vitest                              |
| `pnpm format`    | Formata o código com Prettier                          |
| `pnpm db:push`   | Gera e aplica as migrations do banco                   |

---

## 📁 Estrutura do projeto

```
controle-maternidade-site/
├── client/          # Frontend (React + Vite)
│   └── src/
│       ├── pages/       # Dashboard, Kanban, Clientes, Relatórios...
│       ├── components/  # Componentes de UI reutilizáveis
│       ├── contexts/    # Contextos React
│       └── hooks/       # Hooks customizados
├── server/          # Backend (Express + tRPC)
│   ├── routers/         # auth, clientes, gps, honorarios, metas...
│   └── db.ts            # Conexão com o banco
├── shared/          # Código e tipos compartilhados (status, const)
├── drizzle/         # Schema e migrations do banco de dados
├── data/            # Banco SQLite local (gerado automaticamente)
└── package.json
```

---

## 💾 Banco de dados

O banco é criado automaticamente em `data/controle.db`. As principais tabelas:

`users` · `clientes` · `gps` · `honorarios` · `checklistDocumentos` · `tarefasUrgentes` · `usuariosLocais` · `honorariosHistorico` · `metasHonorarios`

**Backup:** basta copiar o arquivo `data/controle.db`.
**Recomeçar do zero:** apague a pasta `data/` e reinicie o sistema — as tabelas são recriadas sozinhas.

---

## 🧯 Solução de problemas

| Problema                          | Solução                                                                 |
| --------------------------------- | ----------------------------------------------------------------------- |
| `Node.js não encontrado`          | Instale o Node.js em https://nodejs.org/                                |
| `Erro ao conectar ao banco`       | Verifique o `.env.local`; ou apague a pasta `data/` e reinicie          |
| `Porta 3000 já está em uso`       | Feche o programa que usa a porta 3000 ou altere-a em `vite.config.ts`   |
| Dependências corrompidas          | Apague `node_modules/` e rode `pnpm install` novamente                  |

---

## 📄 Licença

Distribuído sob a licença **MIT**. Veja o arquivo `LICENSE` para mais detalhes.

---

<p align="center">
  Feito com ❤️ para simplificar a gestão de processos de salário-maternidade.
</p>
