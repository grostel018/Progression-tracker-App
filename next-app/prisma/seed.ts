import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;

  if (!adminEmail) {
    console.warn("SEED_ADMIN_EMAIL is not set. Skipping seed.");
    return;
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: UserRole.ADMIN,
      emailVerified: new Date()
    },
    create: {
      email: adminEmail,
      role: UserRole.ADMIN,
      emailVerified: new Date()
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
