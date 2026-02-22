import dayjs from 'dayjs';
import prisma from '../prisma';
import { AppError } from '../app-error';
import { parseRussianDateToISO, parseDateForSort, parseStartTime, todayMSK } from '../date-utils';
import { cacheInvalidate } from '../cache';
import logger from '../logger';
import type { CreateTournamentInput, UpdateTournamentInput } from '../schemas/tournament.schema';

const INCLUDE_DISCIPLINE = { discipline: { select: { id: true, name: true, color: true, logo_url: true } } } as const;

async function invalidateTournamentCaches(): Promise<void> {
  await Promise.all([
    cacheInvalidate('route:/api/tournaments'),
    cacheInvalidate('route:/api/calendar'),
  ]);
}

function sanitiseUrl(value: string | null | undefined): string | null {
  if (!value || !value.trim()) return null;
  if (value.startsWith('data:')) return null;
  return value.trim();
}

type TournamentWithDiscipline = Awaited<ReturnType<typeof prisma.tournament.findFirst>> & {
  discipline: { id: number; name: string; color: string | null; logo_url: string | null };
};

function flattenTournament(t: NonNullable<TournamentWithDiscipline>, hasBracket = false) {
  const { discipline: disc, ...rest } = t;
  return { ...rest, discipline: disc.name, discipline_color: disc.color, discipline_logo_url: disc.logo_url, has_bracket: hasBracket };
}

export async function getAll(status?: string) {
  const where = status ? { status } : {};
  const isArchive = status === 'finished';

  const tournaments = await prisma.tournament.findMany({
    where,
    include: INCLUDE_DISCIPLINE,
    orderBy: { date: 'desc' },
  });

  const direction = -1;
  tournaments.sort((a: NonNullable<TournamentWithDiscipline>, b: NonNullable<TournamentWithDiscipline>) => {
    const dateA = dayjs(parseDateForSort(a.date));
    const dateB = dayjs(parseDateForSort(b.date));
    const timeA = a.start_time?.toString().match(/(\d{1,2}):(\d{2})/);
    const timeB = b.start_time?.toString().match(/(\d{1,2}):(\d{2})/);
    const fullA = timeA ? dateA.hour(parseInt(timeA[1])).minute(parseInt(timeA[2])) : dateA;
    const fullB = timeB ? dateB.hour(parseInt(timeB[1])).minute(parseInt(timeB[2])) : dateB;
    return (fullA.valueOf() - fullB.valueOf()) * direction;
  });

  syncCalendarEvents(tournaments).catch((err) =>
    logger.error({ err }, 'Calendar sync failed'),
  );

  const bracketCounts = await prisma.bracketMatch.groupBy({
    by: ['tournament_id'],
    _count: { id: true },
  });
  const bracketSet = new Set(bracketCounts.map((b) => b.tournament_id));

  return tournaments.map((t) => flattenTournament(t, bracketSet.has(t.id)));
}

async function syncCalendarEvents(tournaments: TournamentWithDiscipline[]): Promise<void> {
  const active = tournaments.filter((t) => t && t.status === 'active' && t.date);
  if (active.length === 0) return;

  const ids = active.map((t) => t!.id);
  const existing = await prisma.calendarEvent.findMany({
    where: { tournament_id: { in: ids } },
    select: { tournament_id: true },
  });
  const existingIds = new Set(existing.map((e: { tournament_id: number | null }) => e.tournament_id));
  const missing = active.filter((t) => t && !existingIds.has(t.id));
  if (missing.length === 0) return;

  for (const t of missing) {
    if (!t) continue;
    const eventDate = parseRussianDateToISO(t.date);
    if (eventDate) {
      try {
        await prisma.calendarEvent.create({
          data: {
            title: t.title,
            event_date: dayjs.utc(eventDate, 'YYYY-MM-DD').toDate(),
            image_url: t.image_url,
            discipline_id: t.discipline_id,
            prize: t.prize,
            max_teams: t.max_teams,
            registration_link: t.registration_link,
            custom_link: t.custom_link,
            tournament_id: t.id,
            start_time: t.start_time,
            watch_url: t.watch_url,
          },
        });
      } catch (err) {
        logger.error({ err, tournamentId: t.id }, 'Failed to create calendar event');
      }
    }
  }
}

export async function create(data: CreateTournamentInput) {
  const teamsCount = data.status === 'finished' && data.teams !== undefined ? data.teams : 0;

  const tournament = await prisma.tournament.create({
    data: {
      title: data.title,
      discipline_id: data.disciplineId,
      date: data.date,
      prize: data.prize,
      max_teams: data.maxTeams,
      custom_link: sanitiseUrl(data.customLink),
      status: data.status || 'active',
      winner: data.winner || null,
      winner_2nd: data.winner2nd || null,
      winner_3rd: data.winner3rd || null,
      teams: teamsCount,
      watch_url: sanitiseUrl(data.watchUrl),
      start_time: parseStartTime(data.startTime),
      image_url: sanitiseUrl(data.imageUrl),
    },
    include: INCLUDE_DISCIPLINE,
  });

  if (tournament.status === 'active' && data.date) {
    const eventDate = parseRussianDateToISO(data.date);
    if (eventDate) {
      const existing = await prisma.calendarEvent.findFirst({
        where: { tournament_id: tournament.id },
      });
      if (!existing) {
        await prisma.calendarEvent.create({
          data: {
            title: data.title,
            description: data.description || null,
            event_date: dayjs.utc(eventDate, 'YYYY-MM-DD').toDate(),
            image_url: sanitiseUrl(data.imageUrl),
            discipline_id: data.disciplineId,
            prize: data.prize,
            max_teams: data.maxTeams,
            registration_link: tournament.registration_link,
            custom_link: sanitiseUrl(data.customLink),
            tournament_id: tournament.id,
            start_time: parseStartTime(data.startTime),
            watch_url: sanitiseUrl(data.watchUrl),
          },
        });
      }
    }
  }

  await invalidateTournamentCaches();
  return flattenTournament(tournament);
}

export async function update(data: UpdateTournamentInput) {
  const tournament = await prisma.tournament.update({
    where: { id: data.id },
    data: {
      title: data.title,
      discipline_id: data.disciplineId,
      date: data.date,
      prize: data.prize,
      max_teams: data.maxTeams,
      custom_link: sanitiseUrl(data.customLink),
      status: data.status,
      winner: data.winner || null,
      winner_2nd: data.winner2nd || null,
      winner_3rd: data.winner3rd || null,
      watch_url: sanitiseUrl(data.watchUrl),
      start_time: parseStartTime(data.startTime),
      image_url: sanitiseUrl(data.imageUrl),
      updated_at: new Date(),
      ...(data.status === 'finished' && data.teams !== undefined ? { teams: data.teams } : {}),
    },
    include: INCLUDE_DISCIPLINE,
  });

  if (!tournament) throw AppError.notFound('Турнир не найден');

  if (tournament.status === 'active' && data.date) {
    const eventDate = parseRussianDateToISO(data.date);
    if (eventDate) {
      await prisma.calendarEvent.updateMany({
        where: { tournament_id: data.id },
        data: {
          title: data.title,
          description: data.description || null,
          event_date: dayjs.utc(eventDate, 'YYYY-MM-DD').toDate(),
          image_url: sanitiseUrl(data.imageUrl),
          discipline_id: data.disciplineId,
          prize: data.prize,
          max_teams: data.maxTeams,
          registration_link: tournament.registration_link,
          custom_link: sanitiseUrl(data.customLink),
          start_time: parseStartTime(data.startTime),
          watch_url: sanitiseUrl(data.watchUrl),
          updated_at: new Date(),
        },
      });
    }
  } else if (tournament.status === 'finished') {
    await prisma.calendarEvent.deleteMany({ where: { tournament_id: data.id } });
  }

  await invalidateTournamentCaches();
  return flattenTournament(tournament);
}

/**
 * Автоматическое архивирование активных турниров, чья дата уже прошла (по МСК).
 * Запускается периодически из index.ts.
 */
export async function autoArchiveExpired(): Promise<number> {
  const activeTournaments = await prisma.tournament.findMany({
    where: { status: 'active' },
    select: { id: true, date: true },
  });

  if (activeTournaments.length === 0) return 0;

  const today = todayMSK();

  const expiredIds: number[] = [];
  for (const t of activeTournaments) {
    const iso = parseRussianDateToISO(t.date);
    if (iso && iso < today) {
      expiredIds.push(t.id);
    }
  }

  if (expiredIds.length === 0) return 0;

  await prisma.$transaction([
    prisma.tournament.updateMany({
      where: { id: { in: expiredIds } },
      data: { status: 'finished', updated_at: new Date() },
    }),
    prisma.calendarEvent.deleteMany({
      where: { tournament_id: { in: expiredIds } },
    }),
  ]);

  await invalidateTournamentCaches();
  logger.info({ count: expiredIds.length, ids: expiredIds }, 'Auto-archived tournaments');
  return expiredIds.length;
}

export async function remove(id: number) {
  await prisma.calendarEvent.deleteMany({ where: { tournament_id: id } });

  const tournament = await prisma.tournament.delete({
    where: { id },
    include: INCLUDE_DISCIPLINE,
  });
  if (!tournament) throw AppError.notFound('Турнир не найден');

  await invalidateTournamentCaches();
  return flattenTournament(tournament);
}
