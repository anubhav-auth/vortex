import { prisma } from '../src/config/db.js';


async function main() {
  const domains = ['CS', 'EC', 'ME', 'CE', 'BT', 'IT'];

  for (const name of domains) {
    await prisma.domain.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('Seeded domains:', domains);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
