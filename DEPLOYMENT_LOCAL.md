# 🚀 Deployment Local - Controle de Salário-Maternidade

Este guia explica como colocar o sistema rodando na máquina do seu cliente sem precisar de servidor web externo.

## ⚡ Início Rápido (Recomendado)

### Windows
1. Duplo clique em `iniciar-windows.bat`
2. O sistema abrirá automaticamente em `http://localhost:3000`

### Mac/Linux
```bash
./iniciar-mac-linux.sh
```

---

## 📋 Pré-requisitos (Primeira Vez)

Antes de rodar o sistema, instale:

### 1. Node.js (v18+)
- **Windows/Mac**: [nodejs.org](https://nodejs.org/)
- **Linux**: `sudo apt-get install nodejs npm`

### 2. pnpm (Gerenciador de Pacotes)
```bash
npm install -g pnpm
```

> **Não precisa instalar MySQL nem nenhum banco de dados.** O sistema usa
> **SQLite**, que é um arquivo local (`data/controle.db`) criado
> automaticamente. Zero configuração de servidor de banco.

---

## 🗄️ Banco de Dados (SQLite — automático)

Nada a instalar ou criar manualmente. Na primeira inicialização, o sistema
cria o arquivo `data/controle.db` e todas as tabelas automaticamente.

<details>
<summary>Passo antigo (MySQL) — não é mais necessário</summary>

### 1. Criar Banco de Dados

Abra MySQL Workbench ou terminal e execute:

```sql
CREATE DATABASE controle_maternidade CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Criar Usuário (Opcional)

```sql
CREATE USER 'maternidade'@'localhost' IDENTIFIED BY 'senha123';
GRANT ALL PRIVILEGES ON controle_maternidade.* TO 'maternidade'@'localhost';
FLUSH PRIVILEGES;
```

</details>

---

## ⚙️ Configurar Projeto

### 1. Criar arquivo `.env.local`

Na raiz do projeto, crie um arquivo `.env.local`:

```env
DATABASE_URL="file:./data/controle.db"
JWT_SECRET="chave_secreta_muito_longa_com_mais_de_32_caracteres_aleatorio"
VITE_APP_TITLE="Controle Salário-Maternidade"
OWNER_NAME="Steffany Tavares"
```

> `DATABASE_URL` aponta para o arquivo SQLite local. Não precisa de usuário,
> senha ou servidor de banco.

### 2. Instalar Dependências

```bash
pnpm install
```

### 3. Criar Tabelas (opcional)

As tabelas são criadas automaticamente ao iniciar o sistema. Se quiser
criá-las manualmente antes, rode:

```bash
pnpm db:push
```

---

## ▶️ Iniciar o Sistema

### Modo Desenvolvimento (com auto-reload)
```bash
pnpm dev
```

### Modo Produção (otimizado)
```bash
pnpm build
pnpm start
```

**Acesse em:** `http://localhost:3000`

---

## 🌐 Acessar de Outro Computador

Se quiser acessar de outro PC na mesma rede:

1. Descubra o IP da máquina:
   - **Windows**: `ipconfig` (procure por "IPv4 Address")
   - **Mac/Linux**: `ifconfig` (procure por "inet")

2. Acesse: `http://SEU_IP:3000`

Exemplo: `http://192.168.1.100:3000`

---

## 🔧 Solução de Problemas

### ❌ "Porta 3000 já está em uso"
```bash
# Use outra porta
PORT=3001 pnpm dev
# Acesse: http://localhost:3001
```

### ❌ "Erro de conexão com banco de dados"
- Confirme que o `.env.local` tem `DATABASE_URL="file:./data/controle.db"`
- Apague a pasta `data/` e inicie o sistema de novo (as tabelas são
  recriadas automaticamente)

### ❌ "pnpm não encontrado"
```bash
npm install -g pnpm
```

### ❌ "Erro ao instalar dependências"
```bash
pnpm install --force
```

---

## 📊 Backup do Banco de Dados

O banco inteiro é um único arquivo: `data/controle.db`.

### Fazer Backup
Basta copiar o arquivo (com o sistema parado):
```bash
copy data\controle.db backup-controle.db   # Windows
cp data/controle.db backup-controle.db     # Mac/Linux
```

### Restaurar Backup
Substitua o arquivo `data/controle.db` pela cópia de backup.

---

## 🛑 Parar o Sistema

Pressione `Ctrl + C` no terminal.

---

## 📁 Estrutura de Pastas

```
controle-maternidade-site/
├── client/              # Frontend (React)
├── server/              # Backend (Node.js)
├── drizzle/             # Banco de dados
├── package.json         # Dependências
├── .env.local          # Configurações (criar)
├── iniciar-windows.bat # Script Windows
└── iniciar-mac-linux.sh # Script Mac/Linux
```

---

## 💡 Dicas

1. **Dados de Teste**: Adicione clientes via interface
2. **Logs**: Veja erros em `.manus-logs/`
3. **Banco**: Tudo fica no arquivo `data/controle.db` (SQLite)
4. **Segurança**: Altere `JWT_SECRET` para valor único
5. **Backup**: Copie o arquivo `data/controle.db` regularmente

---

## 📞 Suporte

Se tiver problemas:
1. Verifique `.manus-logs/devserver.log`
2. Confirme que o `.env.local` existe com `DATABASE_URL="file:./data/controle.db"`
3. Apague a pasta `data/` para recriar o banco do zero
4. Limpe cache: `pnpm install --force && pnpm build`

---

**Versão:** 1.0  
**Data:** Julho 2026  
**Sistema:** Controle de Salário-Maternidade
