import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.lawyer.findFirst({ where: { oab: "OAB/AL 14.662" } });
  if (!existing) {
    await prisma.lawyer.create({
      data: {
        name: "Wilson Veras de Andrade",
        oab: "OAB/AL 14.662",
        role: "advogado",
        email: "wilsonandradeadvocacia@gmail.com",
        phone: "(82) 99614-3977",
        areas: "Cível, Tributário, Municipal, Contratual",
      },
    });
    console.log("Advogado titular cadastrado.");
  }

  const account = await prisma.financeAccount.findFirst();
  if (!account) {
    await prisma.financeAccount.create({
      data: { bank: "Banco C6 S.A.", agency: "0001", accountNumber: "41056451-6", type: "corrente" },
    });
    console.log("Conta bancária padrão cadastrada.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
