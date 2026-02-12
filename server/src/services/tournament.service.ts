import prisma from '../prisma';
import { AppError } from '../app-error';
import { parseRussianDateToISO, parseDateForSort } from '../date-utils';
import { cacheInvalidate } from '../cache';
import type { CreateTournamentInput, UpdateTournamentInput } from '../schemas/tournament.schema';
import type { Tournament } from '@prisma/client';

function invalidateTournamentCaches(): void {
  cacheInvalidate('route:/api/tournaments');
  cacheInvalidate('route:/api/calendar');
}

export async function getAll(status?: string): Promise<Tournament[]> {
  const where = status ? { status } : {};
  const tournaments = await prisma.tournament.findMany({
    where,
    orderBy: { date: 'asc' },
  });

  // Sort by parsed date + time
  tournaments.sort((a, b) => {
    const dateA = parseDateForSort(a.date);
    const dateB = parseDateForSort(b.date);
    const timeA = a.start_time?.toString().match(/(\d{1,2}):(\d{2})/);
    const timeB = b.start_time?.toString().match(/(\d{1,2}):(\d{2})/);
    if (timeA && timeB) {
      dateA.setHours(parseInt(timeA[1]), parseInt(timeA[2]), 0, 0);
      dateB.setHours(parseInt(timeB[1]), parseInt(timeB[2]), 0, 0);
    }
    return dateA.getTime() - dateB.getTime();
  });

  // Batch-create missing calendar events for active tournaments
  const active = tournaments.filter((t) => t.status === 'active' && t.date);
  if (active.length > 0) {
    const ids = active.map((t) => t.id);
    const existing = await prisma.calendarEvent.findMany({
      where: { tournament_id: { in: ids } },
      select: { tournament_id: true },
    });
    const existingIds = new Set(existing.map((e) => e.tournament_id));

    for (const t of active.filter((t) => !existingIds.has(t.id))) {
      const eventDate = parseRussianDateToISO(t.date);
      if (eventDate) {
        try {
          await prisma.calendarEvent.create({
            data: {
              title: t.title,
              event_date: new Date(eventDate),
              discipline: t.discipline,
              prize: t.prize,
              max_teams: t.max_teams,
              custom_link: t.custom_link,
              tournament_id: t.id,
              start_time: t.start_time,
              watch_url: t.watch_url,
            },
          });
        } catch (err) {
          console.error(`Error creating calendar event for tournament ${t.id}:`, err);
        }
      }
    }
  }

  return tournaments;
}

export async function create(data: CreateTournamentInput): Promise<Tournament> {
  const teamsCount = data.status === 'finished' && data.teams !== undefined ? data.teams : 0;

  const tournament = await prisma.tournament.create({
    data: {
      title: data.title,
      discipline: data.discipline,
      date: data.date,
      prize: data.prize,
      max_teams: data.maxTeams,
      custom_link: data.customLink || null,
      status: data.status || 'active',
      winner: data.winner || null,
      teams: teamsCount,
      watch_url: data.watchUrl || null,
      start_time: data.startTime ? new Date(`1970-01-01T${data.startTime}`) : null,
      image_url: data.imageUrl || null,
    },
  });

  // Auto-create calendar event for active tournaments
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
            event_date: new Date(eventDate),
            image_url: data.imageUrl || null,
            discipline: data.discipline,
            prize: data.prize,
            max_teams: data.maxTeams,
            custom_link: data.customLink || null,
            tournament_id: tournament.id,
            start_time: data.startTime ? new Date(`1970-01-01T${data.startTime}`) : null,
            watch_url: data.watchUrl || null,
          },
        });
      }
    }
  }

  invalidateTournamentCaches();
  return tournament;
}

export async function update(data: UpdateTournamentInput): Promise<Tournament> {
  const updateData: Record<string, unknown> = {
    title: data.title,
    discipline: data.discipline,
    date: data.date,
    prize: data.prize,
    max_teams: data.maxTeams,
    custom_link: data.customLink || null,
    status: data.status,
    winner: data.winner || null,
    watch_url: data.watchUrl || null,
    start_time: data.startTime ? new Date(`1970-01-01T${data.startTime}`) : null,
    image_url: data.imageUrl || null,
    updated_at: new Date(),
  };

  if (data.status === 'finished' && data.teams !== undefined) {
    updateData.teams = data.teams;
  }

  const tournament = await prisma.tournament.update({
    where: { id: data.id },
    data: updateData,
  });

  if (!tournament) throw AppError.notFound('Турнир не найден');

  // Sync calendar event
  if (tournament.status === 'active' && data.date) {
    const eventDate = parseRussianDateToISO(data.date);
    if (eventDate) {
      await prisma.calendarEvent.updateMany({
        where: { tournament_id: data.id },
        data: {
          title: data.title,
          description: data.description || null,
          event_date: new Date(eventDate),
          image_url: data.imageUrl || null,
          discipline: data.discipline,
          prize: data.prize,
          max_teams: data.maxTeams,
          custom_link: data.customLink || null,
          start_time: data.startTime ? new Date(`1970-01-01T${data.startTime}`) : null,
          watch_url: data.watchUrl || null,
          updated_at: new Date(),
        },
      });
    }
  } else if (tournament.status === 'finished') {
    await prisma.calendarEvent.deleteMany({ where: { tournament_id: data.id } });
  }

  invalidateTournamentCaches();
  return tournament;
}

export async function remove(id: number): Promise<Tournament> {
  await prisma.calendarEvent.deleteMany({ where: { tournament_id: id } });

  const tournament = await prisma.tournament.delete({ where: { id } });
  if (!tournament) throw AppError.notFound('Турнир не найден');

  invalidateTournamentCaches();
  return tournament;
}
