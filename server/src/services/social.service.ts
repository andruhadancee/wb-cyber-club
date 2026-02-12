import prisma from '../prisma';
import { cacheInvalidate } from '../cache';
import type { SaveSocialLinksInput } from '../schemas/social.schema';
import type { SocialLinks } from '@wb/shared';

function invalidateCache(): void {
  cacheInvalidate('route:/api/social');
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
  await prisma.socialLink.deleteMany();

  const platforms = [
    { platform: 'twitch', link: data.twitch },
    { platform: 'telegram', link: data.telegram },
    { platform: 'discord', link: data.discord },
    { platform: 'contact', link: data.contact },
  ].filter((p) => p.link?.trim()) as { platform: string; link: string }[];

  if (platforms.length > 0) {
    await prisma.socialLink.createMany({
      data: platforms.map((p) => ({
        platform: p.platform,
        link: p.link.trim(),
      })),
    });
  }

  invalidateCache();
}
