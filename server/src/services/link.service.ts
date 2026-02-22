import prisma from '../prisma';
import { cacheInvalidate } from '../cache';

async function invalidateCache(): Promise<void> {
  await cacheInvalidate('route:/api/links');
}

/** Returns Record<disciplineId (string), link> */
export async function getAll(): Promise<Record<string, string>> {
  const rows = await prisma.registrationLink.findMany({
    include: { discipline: { select: { id: true, name: true } } },
    orderBy: { discipline_id: 'asc' },
  });

  const links: Record<string, string> = {};
  for (const row of rows) {
    links[String(row.discipline_id)] = row.link;
  }
  return links;
}

/** Accepts Record<disciplineId (string), link> */
export async function save(links: Record<string, string>): Promise<void> {
  const entries = Object.entries(links).filter(([, link]) => link?.trim());

  await prisma.$transaction(async (tx) => {
    await tx.registrationLink.deleteMany();
    if (entries.length > 0) {
      await tx.registrationLink.createMany({
        data: entries.map(([disciplineId, link]) => ({
          discipline_id: parseInt(disciplineId, 10),
          link: link.trim(),
        })),
      });
    }
  });

  await invalidateCache();
}
