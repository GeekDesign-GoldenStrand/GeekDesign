const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const mats = await prisma.materiales.findMany();
  console.log(mats.map((m) => m.id_material));
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
