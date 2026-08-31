import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Sem dados fixos de exemplo: cada instalação cadastra seu próprio
// advogado titular (Advogados), conta bancária (Financeiro) e dados do
// escritório (Configurações) pela própria interface, na primeira vez que
// usar o sistema — assim o código-fonte não carrega dados reais de nenhum
// escritório específico.
async function main() {}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
