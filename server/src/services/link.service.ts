import prisma from '../prisma';
import { cacheInvalidate } from '../cache';
import type { RegistrationLinks } from '@wb/shared';

function invalidateCache(): void {
  cacheInvalidate('route:/api/links');
}

export async function getAll(): Promise<RegistrationLinks> {
  const rows = await prisma.registrationLink.findMany({
    orderBy: { discipline: 'asc' },
  });

  const links: RegistrationLinks = {};
  for (const row of rows) {
    links[row.discipline] = row.link;
  }
  return links;
}

export async function save(links: RegistrationLinks): Promise<void> {
  const entries = Object.entries(links).filter(([, link]) => link?.trim());

  await prisma.$transaction(async (tx) => {
    await tx.registrationLink.deleteMany();
    if (entries.length > 0) {
      await tx.registrationLink.createMany({
        data: entries.map(([discipline, link]) => ({ discipline, link: link.trim() })),
      });
    }
  });

  invalidateCache();
}
