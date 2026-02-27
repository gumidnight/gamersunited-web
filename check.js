const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const images = await prisma.variantImage.findMany({
    take: 10
  });
  console.log("Images", images);
  
  const v = await prisma.variant.findFirst({
      where: { images: { hasSome: [] } }
  });
}
main();
