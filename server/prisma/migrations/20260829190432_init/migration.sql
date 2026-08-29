-- CreateTable
CREATE TABLE "Escritorio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomeEscritorio" TEXT NOT NULL,
    "nomeAdvogadoResponsavel" TEXT NOT NULL,
    "oabNumero" TEXT NOT NULL,
    "oabUf" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "escritorioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "Escritorio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "escritorioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "profissaoOuRamo" TEXT NOT NULL,
    "estadoCivil" TEXT,
    "nacionalidade" TEXT,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cliente_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "Escritorio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "escritorioId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uf" TEXT NOT NULL,
    "servico" TEXT NOT NULL,
    "descricaoServico" TEXT NOT NULL,
    "origemValor" TEXT NOT NULL,
    "itemTabelaId" TEXT,
    "valorHonorarios" REAL NOT NULL,
    "formaPagamento" TEXT NOT NULL,
    "numeroParcelas" INTEGER NOT NULL,
    "primeiraParcelaData" TEXT NOT NULL,
    "parcelasJson" TEXT NOT NULL,
    "clausulasAdicionais" TEXT,
    "procuracaoPoderes" TEXT,
    "assinado" BOOLEAN NOT NULL DEFAULT false,
    "dataAssinatura" TEXT,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    CONSTRAINT "Contrato_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "Escritorio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LancamentoFinanceiro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "escritorioId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "parcelaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "dataVencimento" TEXT NOT NULL,
    "dataRecebimento" TEXT,
    "status" TEXT NOT NULL DEFAULT 'previsto',
    CONSTRAINT "LancamentoFinanceiro_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "Escritorio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LancamentoFinanceiro_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LancamentoFinanceiro_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventoAgenda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "escritorioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "clienteId" TEXT,
    "contratoId" TEXT,
    "parcelaId" TEXT,
    "valor" REAL,
    "descricao" TEXT,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "EventoAgenda_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "Escritorio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EventoAgenda_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EventoAgenda_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TabelaOAB" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "escritorioId" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "nomeSeccional" TEXT NOT NULL,
    "vigencia" TEXT NOT NULL,
    "fonteUrl" TEXT,
    "statusDados" TEXT NOT NULL,
    "itensJson" TEXT NOT NULL,
    CONSTRAINT "TabelaOAB_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "Escritorio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TabelaOAB_escritorioId_uf_key" ON "TabelaOAB"("escritorioId", "uf");
