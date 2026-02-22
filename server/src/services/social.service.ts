import prisma from '../prisma';
import { cacheInvalidate } from '../cache';
import type { SaveSocialLinksInput } from '../schemas/social.schema';
import type { SocialLinks } from '@wb/shared';

async function invalidateCache(): Promise<void> {
  await cacheInvalidate('route:/api/social');
}

export async function getAll(): Promise<SocialLinks> {
  const rows = await prisma.socialLink.findMany();
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.platform] = row.link;
  }
  return result as SocialLinks;
}

export async function save(data: SaveSocialLinksInput): Promise<void> {
  const platforms = [
    { platform: 'twitch', link: data.twitch },
    { platform: 'telegram', link: data.telegram },
    { platform: 'discord', link: data.discord },
    { platform: 'contact', link: data.contact },
  ].filter((p) => p.link?.trim()) as { platform: string; link: string }[];

  await prisma.$transaction(async (tx) => {
    await tx.socialLink.deleteMany();
    if (platforms.length > 0) {
      await tx.socialLink.createMany({
        data: platforms.map((p) => ({ platform: p.platform, link: p.link.trim() })),
      });
    }
  });

  await invalidateCache();
}
