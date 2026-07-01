CREATE TABLE `checklistDocumentos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clienteId` integer NOT NULL,
	`certidao` integer DEFAULT false,
	`rg` integer DEFAULT false,
	`cpf` integer DEFAULT false,
	`procuracao` integer DEFAULT false,
	`complementares` integer DEFAULT false,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `checklistDocumentos_clienteId_unique` ON `checklistDocumentos` (`clienteId`);--> statement-breakpoint
CREATE TABLE `clientes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`cpf` text NOT NULL,
	`telefone` text,
	`origem` text,
	`dataContratacao` integer NOT NULL,
	`dpp` integer NOT NULL,
	`dataNascimento` integer,
	`observacoes` text,
	`etapa` integer DEFAULT 0 NOT NULL,
	`urgenteAbsoluta` integer DEFAULT false,
	`inadimplente` integer DEFAULT false,
	`dataConclusao` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clientes_cpf_unique` ON `clientes` (`cpf`);--> statement-breakpoint
CREATE TABLE `gps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clienteId` integer NOT NULL,
	`competencia` text NOT NULL,
	`vencimento` integer NOT NULL,
	`valor` text DEFAULT '178.00',
	`paga` integer DEFAULT false,
	`dataComprovante` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `honorarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clienteId` integer NOT NULL,
	`valorTotal` text NOT NULL,
	`formaPagamento` text,
	`parcelamento` text,
	`dataVencimento` integer,
	`valorPrimeiraParcela` text,
	`vencimentoSegundaParcela` integer,
	`observacoes` text,
	`recebido` integer DEFAULT false,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `honorariosHistorico` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mes` text NOT NULL,
	`valorRecebido` text DEFAULT '0',
	`valorPendente` text DEFAULT '0',
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `metasHonorarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tipo` text NOT NULL,
	`periodo` text NOT NULL,
	`valorMeta` text NOT NULL,
	`descricao` text,
	`ativo` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tarefasUrgentes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clienteId` integer NOT NULL,
	`tarefa` text NOT NULL,
	`concluida` integer DEFAULT false,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`lastSignedIn` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
CREATE TABLE `usuariosLocais` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`nome` text NOT NULL,
	`senhaHash` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`ativo` integer DEFAULT true,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuariosLocais_email_unique` ON `usuariosLocais` (`email`);