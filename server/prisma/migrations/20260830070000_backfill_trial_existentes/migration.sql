-- Garante que escritórios cadastrados antes do recurso de assinatura não fiquem bloqueados
-- imediatamente: concede um período de teste de 30 dias a partir deste deploy.
UPDATE "Escritorio" SET "trialAte" = datetime('now', '+30 days') WHERE "trialAte" IS NULL;
