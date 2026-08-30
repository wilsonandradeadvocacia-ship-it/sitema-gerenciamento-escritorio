-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Escritorio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomeEscritorio" TEXT NOT NULL,
    "nomeAdvogadoResponsavel" TEXT NOT NULL,
    "oabNumero" TEXT NOT NULL,
    "oabUf" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "banco" TEXT,
    "agencia" TEXT,
    "conta" TEXT,
    "pix" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "planoStatus" TEXT NOT NULL DEFAULT 'trial',
    "trialAte" DATETIME,
    "dataProximoVencimento" DATETIME,
    "asaasCustomerId" TEXT,
    "asaasSubscriptionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Escritorio" ("agencia", "banco", "conta", "cpfCnpj", "createdAt", "endereco", "id", "nomeAdvogadoResponsavel", "nomeEscritorio", "oabNumero", "oabUf", "pix") SELECT "agencia", "banco", "conta", "cpfCnpj", "createdAt", "endereco", "id", "nomeAdvogadoResponsavel", "nomeEscritorio", "oabNumero", "oabUf", "pix" FROM "Escritorio";
DROP TABLE "Escritorio";
ALTER TABLE "new_Escritorio" RENAME TO "Escritorio";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
