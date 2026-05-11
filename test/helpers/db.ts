import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function seedTestUser(
  id: string,
  email: string,
  isEnabled: boolean,
  displayName?: string,
): Promise<void> {
  try {
    await prisma.user.upsert({
      where: { googleSubject: `google-sub-${id}` },
      create: {
        id,
        googleSubject: `google-sub-${id}`,
        email,
        displayName: displayName ?? email,
        isEnabled,
      },
      update: { isEnabled },
    });
  } catch (e) {
    // Tolerate constraint errors from parallel seeding of the same user
    const msg = String(e);
    if (!msg.includes('Unique constraint')) throw e;
  }
}

export async function cleanupUser(userId: string): Promise<void> {
  // Delete in dependency order (children before parents)
  await prisma.aiAnalysis.deleteMany({ where: { ownerUserId: userId } });
  await prisma.plantPhoto.deleteMany({ where: { ownerUserId: userId } });
  await prisma.plantStatusReport.deleteMany({ where: { ownerUserId: userId } });
  await prisma.plantEvent.deleteMany({ where: { ownerUserId: userId } });
  await prisma.plantRequirement.deleteMany({ where: { ownerUserId: userId } });
  await prisma.plant.deleteMany({ where: { ownerUserId: userId } });
  await prisma.room.deleteMany({ where: { ownerUserId: userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}

export async function createPlantForTest(input: {
  ownerUserId: string;
  name: string;
  species?: string;
  category?: string;
  potSizeCm?: number;
}): Promise<{ id: string }> {
  return prisma.plant.create({
    data: {
      ownerUserId: input.ownerUserId,
      name: input.name,
      species: input.species,
      category: input.category,
      potSizeCm: input.potSizeCm,
    },
    select: { id: true },
  });
}
