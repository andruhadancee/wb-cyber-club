import prisma from '../prisma';
import { parseRussianDateToISO } from '../date-utils';

interface ArchiveResult {
  message: string;
  archived: number;
}

export async function autoArchive(): Promise<ArchiveResult> {
  console.log('Running auto-archive...');

  const tournaments = await prisma.tournament.findMany({
    where: { status: 'active' },
  });

  if (tournaments.length === 0) {
    return { message: 'Нет турниров для архивирования', archived: 0 };
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  let archivedCount = 0;

  for (const tournament of tournaments) {
    const isoDate = parseRussianDateToISO(tournament.date);
    if (!isoDate) continue;

    if (isoDate <= todayStr) {
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { status: 'finished', updated_at: new Date() },
      });

      await prisma.calendarEvent.deleteMany({
        where: { tournament_id: tournament.id },
      });

      archivedCount++;
      console.log(`Archived tournament "${tournament.title}" (ID: ${tournament.id})`);
    }
  }

  console.log(`Archived: ${archivedCount}`);
  return { message: 'Архивирование завершено', archived: archivedCount };
}
