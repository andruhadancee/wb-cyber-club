import prisma from '../prisma';
import { parseRussianDateToISO, todayMSK } from '../date-utils';
import logger from '../logger';

interface ArchiveResult {
  message: string;
  archived: number;
}

export async function autoArchive(): Promise<ArchiveResult> {
  logger.debug('Running auto-archive');

  const tournaments = await prisma.tournament.findMany({
    where: { status: 'active' },
  });

  if (tournaments.length === 0) {
    return { message: 'Нет турниров для архивирования', archived: 0 };
  }

  const todayStr = todayMSK();
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
      logger.info({ tournamentId: tournament.id, title: tournament.title }, 'Tournament archived');
    }
  }

  logger.info({ archivedCount }, 'Auto-archive complete');
  return { message: 'Архивирование завершено', archived: archivedCount };
}
