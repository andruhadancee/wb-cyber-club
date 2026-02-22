import dayjs from 'dayjs';
import prisma from '../prisma';
import { AppError } from '../app-error';
import { parseStartTime, parseRussianDateToISO } from '../date-utils';
import { cacheInvalidate } from '../cache';
import type { CreateCalendarEventInput, UpdateCalendarEventInput } from '../schemas/calendar.schema';

const INCLUDE_DISCIPLINE = { discipline: { select: { id: true, name: true, color: true, logo_url: true } } } as const;

async function invalidateCalendarCaches(): Promise<void> {
  await Promise.all([
    cacheInvalidate('route:/api/calendar'),
    cacheInvalidate('route:/api/tournaments'),
  ]);
}

function flattenEvent(e: any) {
  const { discipline: disc, ...rest } = e;
  return { ...rest, discipline: disc?.name ?? null, discipline_color: disc?.color ?? null, discipline_logo_url: disc?.logo_url ?? null };
}

export async function getAll(month?: string) {
  const where = month
    ? (() => {
        const start = dayjs.utc(month, 'YYYY-MM').startOf('month');
        const end = start.add(1, 'month');
        return { event_date: { gte: start.toDate(), lt: end.toDate() } };
      })()
    : {};

  const events = await prisma.calendarEvent.findMany({
    where,
    include: INCLUDE_DISCIPLINE,
    orderBy: [{ event_date: 'asc' }, { created_at: 'desc' }],
  });

  const flatEvents = events.map(flattenEvent);

  if (!month) return flatEvents;

  const archivedTournaments = await getArchivedTournamentsForMonth(month);
  return [...flatEvents, ...archivedTournaments];
}

async function getArchivedTournamentsForMonth(month: string) {
  const start = dayjs.utc(month, 'YYYY-MM').startOf('month');
  const end = start.add(1, 'month');

  const tournaments = await prisma.tournament.findMany({
    where: { status: 'finished' },
    include: INCLUDE_DISCIPLINE,
  });

  const existingTournamentIds = new Set(
    (await prisma.calendarEvent.findMany({
      where: { tournament_id: { not: null } },
      select: { tournament_id: true },
    })).map((e) => e.tournament_id),
  );

  const results: any[] = [];

  for (const t of tournaments) {
    if (existingTournamentIds.has(t.id)) continue;

    const iso = parseRussianDateToISO(t.date);
    if (!iso) continue;

    const d = dayjs.utc(iso, 'YYYY-MM-DD');
    if (d.isBefore(start) || !d.isBefore(end)) continue;

    const disc = (t as any).discipline;
    results.push({
      id: -t.id,
      title: t.title,
      description: null,
      event_date: d.format('YYYY-MM-DD'),
      image_url: t.image_url,
      discipline_id: t.discipline_id,
      discipline: disc?.name ?? null,
      discipline_color: disc?.color ?? null,
      discipline_logo_url: disc?.logo_url ?? null,
      prize: t.prize,
      max_teams: t.max_teams,
      registration_link: t.registration_link,
      custom_link: t.custom_link,
      tournament_id: t.id,
      start_time: t.start_time,
      watch_url: t.watch_url,
      is_archived: true,
      winner: t.winner,
      winner_2nd: t.winner_2nd,
      winner_3rd: t.winner_3rd,
      teams: t.teams,
      created_at: t.created_at,
      updated_at: t.updated_at,
    });
  }

  return results;
}

export async function create(data: CreateCalendarEventInput) {
  let tournamentId: number | null = data.tournamentId ?? null;

  if (tournamentId) {
    const existing = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!existing) throw AppError.notFound('Турнир не найден');
  } else if (data.disciplineId && data.prize && data.maxTeams) {
    const created = await prisma.tournament.create({
      data: {
        title: data.title,
        discipline_id: data.disciplineId,
        date: data.eventDate,
        prize: data.prize,
        max_teams: data.maxTeams,
        custom_link: data.customLink || data.registrationLink || null,
        status: 'active',
        teams: 0,
        watch_url: data.watchUrl || null,
        start_time: parseStartTime(data.startTime),
      },
    });
    tournamentId = created.id;
  }

  const existingEvent = tournamentId
    ? await prisma.calendarEvent.findFirst({ where: { tournament_id: tournamentId } })
    : null;

  const eventData = {
    title: data.title,
    description: data.description || null,
    image_url: data.imageUrl || null,
    discipline_id: data.disciplineId || null,
    prize: data.prize || null,
    max_teams: data.maxTeams || null,
    registration_link: data.registrationLink || null,
    custom_link: data.customLink || null,
    tournament_id: tournamentId,
    start_time: parseStartTime(data.startTime),
    watch_url: data.watchUrl || null,
  };

  let result;

  if (existingEvent) {
    result = await prisma.calendarEvent.update({
      where: { id: existingEvent.id },
      data: { ...eventData, updated_at: new Date() },
      include: INCLUDE_DISCIPLINE,
    });
  } else {
    result = await prisma.calendarEvent.create({
      data: { ...eventData, event_date: dayjs.utc(data.eventDate, 'YYYY-MM-DD').toDate() },
      include: INCLUDE_DISCIPLINE,
    });
  }

  await invalidateCalendarCaches();
  return flattenEvent(result);
}

export async function update(data: UpdateCalendarEventInput) {
  const current = await prisma.calendarEvent.findUnique({
    where: { id: data.id },
    select: { tournament_id: true },
  });

  if (current?.tournament_id) {
    await prisma.tournament.update({
      where: { id: current.tournament_id },
      data: {
        title: data.title,
        discipline_id: data.disciplineId || undefined,
        date: data.eventDate,
        prize: data.prize || undefined,
        max_teams: data.maxTeams ?? undefined,
        custom_link: data.customLink || data.registrationLink || null,
        start_time: parseStartTime(data.startTime),
        watch_url: data.watchUrl || null,
        image_url: data.imageUrl || null,
        updated_at: new Date(),
      },
    });
  }

  const event = await prisma.calendarEvent.update({
    where: { id: data.id },
    data: {
      title: data.title,
      description: data.description || null,
      event_date: dayjs.utc(data.eventDate, 'YYYY-MM-DD').toDate(),
      image_url: data.imageUrl || null,
      discipline_id: data.disciplineId || null,
      prize: data.prize || null,
      max_teams: data.maxTeams || null,
      registration_link: data.registrationLink || null,
      custom_link: data.customLink || null,
      start_time: parseStartTime(data.startTime),
      watch_url: data.watchUrl || null,
      updated_at: new Date(),
    },
    include: INCLUDE_DISCIPLINE,
  });

  if (!event) throw AppError.notFound('Событие не найдено');

  await invalidateCalendarCaches();
  return flattenEvent(event);
}

export async function remove(id: number) {
  const event = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!event) throw AppError.notFound('Событие не найдено');

  const deleted = await prisma.calendarEvent.delete({
    where: { id },
    include: INCLUDE_DISCIPLINE,
  });

  if (event.tournament_id) {
    const otherCount = await prisma.calendarEvent.count({
      where: { tournament_id: event.tournament_id },
    });
    if (otherCount === 0) {
      await prisma.tournament.delete({ where: { id: event.tournament_id } });
    }
  }

  await invalidateCalendarCaches();
  return flattenEvent(deleted);
}
