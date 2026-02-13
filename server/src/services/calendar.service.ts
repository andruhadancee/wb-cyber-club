import prisma from '../prisma';
import { AppError } from '../app-error';
import { cacheInvalidate } from '../cache';
import type { CreateCalendarEventInput, UpdateCalendarEventInput } from '../schemas/calendar.schema';
import type { CalendarEvent } from '@prisma/client';

function invalidateCalendarCaches(): void {
  cacheInvalidate('route:/api/calendar');
  cacheInvalidate('route:/api/tournaments');
}

export async function getAll(month?: string): Promise<CalendarEvent[]> {
  if (month) {
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    return prisma.calendarEvent.findMany({
      where: {
        event_date: { gte: startDate, lt: endDate },
      },
      orderBy: [{ event_date: 'asc' }, { created_at: 'desc' }],
    });
  }

  return prisma.calendarEvent.findMany({
    orderBy: [{ event_date: 'asc' }, { created_at: 'desc' }],
  });
}

export async function create(data: CreateCalendarEventInput): Promise<CalendarEvent> {
  let tournamentId: number | null = data.tournamentId ?? null;

  // Link to existing tournament by id if provided
  if (tournamentId) {
    const existing = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!existing) throw AppError.notFound('Турнир не найден');
  } else if (data.discipline && data.prize && data.maxTeams) {
    // Auto-create tournament if full tournament data provided (but no tournamentId)
    const created = await prisma.tournament.create({
      data: {
        title: data.title,
        discipline: data.discipline,
        date: data.eventDate,
        prize: data.prize,
        max_teams: data.maxTeams,
        custom_link: data.customLink || data.registrationLink || null,
        status: 'active',
        teams: 0,
        watch_url: data.watchUrl || null,
        start_time: data.startTime ? new Date(`1970-01-01T${data.startTime}`) : null,
      },
    });
    tournamentId = created.id;
  }

  // Check for existing event by tournament_id
  const existingEvent = tournamentId
    ? await prisma.calendarEvent.findFirst({ where: { tournament_id: tournamentId } })
    : null;

  const eventData = {
    title: data.title,
    description: data.description || null,
    image_url: data.imageUrl || null,
    discipline: data.discipline || null,
    prize: data.prize || null,
    max_teams: data.maxTeams || null,
    registration_link: data.registrationLink || null,
    custom_link: data.customLink || null,
    tournament_id: tournamentId,
    start_time: data.startTime ? new Date(`1970-01-01T${data.startTime}`) : null,
    watch_url: data.watchUrl || null,
  };

  let result: CalendarEvent;

  if (existingEvent) {
    result = await prisma.calendarEvent.update({
      where: { id: existingEvent.id },
      data: { ...eventData, updated_at: new Date() },
    });
  } else {
    result = await prisma.calendarEvent.create({
      data: { ...eventData, event_date: new Date(data.eventDate) },
    });
  }

  invalidateCalendarCaches();
  return result;
}

export async function update(data: UpdateCalendarEventInput): Promise<CalendarEvent> {
  // Update linked tournament
  const current = await prisma.calendarEvent.findUnique({
    where: { id: data.id },
    select: { tournament_id: true },
  });

  if (current?.tournament_id) {
    await prisma.tournament.update({
      where: { id: current.tournament_id },
      data: {
        title: data.title,
        discipline: data.discipline || undefined,
        date: data.eventDate,
        prize: data.prize || undefined,
        max_teams: data.maxTeams ?? undefined,
        custom_link: data.customLink || data.registrationLink || null,
        start_time: data.startTime ? new Date(`1970-01-01T${data.startTime}`) : null,
        watch_url: data.watchUrl || null,
        updated_at: new Date(),
      },
    });
  }

  const event = await prisma.calendarEvent.update({
    where: { id: data.id },
    data: {
      title: data.title,
      description: data.description || null,
      event_date: new Date(data.eventDate),
      image_url: data.imageUrl || null,
      discipline: data.discipline || null,
      prize: data.prize || null,
      max_teams: data.maxTeams || null,
      registration_link: data.registrationLink || null,
      custom_link: data.customLink || null,
      start_time: data.startTime ? new Date(`1970-01-01T${data.startTime}`) : null,
      watch_url: data.watchUrl || null,
      updated_at: new Date(),
    },
  });

  if (!event) throw AppError.notFound('Событие не найдено');

  invalidateCalendarCaches();
  return event;
}

export async function remove(id: number): Promise<CalendarEvent> {
  const event = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!event) throw AppError.notFound('Событие не найдено');

  const deleted = await prisma.calendarEvent.delete({ where: { id } });

  // Delete linked tournament if no more events reference it
  if (event.tournament_id) {
    const otherCount = await prisma.calendarEvent.count({
      where: { tournament_id: event.tournament_id },
    });
    if (otherCount === 0) {
      await prisma.tournament.delete({ where: { id: event.tournament_id } });
    }
  }

  invalidateCalendarCaches();
  return deleted;
}
