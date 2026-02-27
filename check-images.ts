import { prisma } from './lib/prisma';
async function main() {
    const images = await prisma.variantImage.findMany({
        take: 10
    });
    console.log(images);

    // fetch distinct urls inside images list of varaints
    const variants = await prisma.variant.findMany({
        select: {
            images: true
        },
        take: 3
    });
    console.log("variant.images:", variants.map(v => v.images));
}
main();
