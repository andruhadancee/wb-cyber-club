import prisma from '../prisma';
import { AppError } from '../app-error';
import type { CreateTeamInput, UpdateTeamInput, BulkCreateTeamInput } from '../schemas/team.schema';
import type { RegisteredTeam } from '@prisma/client';

type TeamsByTournament = Record<string, RegisteredTeam[]>;

async function updateTeamCount(tournamentId: number): Promise<void> {
  const count = await prisma.registeredTeam.count({
    where: { tournament_id: tournamentId },
  });
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { teams: count },
  });
}

export async function getAll(tournamentId?: number, tournamentStatus?: string): Promise<TeamsByTournament> {
  let tournamentIds: number[] | undefined;

  if (tournamentId) {
    tournamentIds = [tournamentId];
  } else if (tournamentStatus) {
    const tournaments = await prisma.tournament.findMany({
      where: { status: tournamentStatus },
      select: { id: true },
    });
    tournamentIds = tournaments.map((t) => t.id);
    if (tournamentIds.length === 0) return {};
  }

  const where = tournamentIds ? { tournament_id: { in: tournamentIds } } : {};
  const teams = await prisma.registeredTeam.findMany({
    where,
    orderBy: { created_at: 'desc' },
  });

  const grouped: TeamsByTournament = {};
  for (const team of teams) {
    const key = String(team.tournament_id);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(team);
  }

  return grouped;
}

export async function create(data: CreateTeamInput): Promise<RegisteredTeam> {
  const team = await prisma.registeredTeam.create({
    data: {
      tournament_id: data.tournamentId,
      name: data.name,
      players: data.players,
      captain: '',
      registration_date: new Date().toLocaleDateString('ru-RU'),
    },
  });

  await updateTeamCount(data.tournamentId);
  return team;
}

export async function bulkCreate(data: BulkCreateTeamInput): Promise<{ created: number }> {
  const regDate = new Date().toLocaleDateString('ru-RU');

  await prisma.registeredTeam.createMany({
    data: data.names.map((name) => ({
      tournament_id: data.tournamentId,
      name: name.trim(),
      players: data.players,
      captain: '',
      registration_date: regDate,
    })),
  });

  await updateTeamCount(data.tournamentId);
  return { created: data.names.length };
}

export async function update(data: UpdateTeamInput): Promise<RegisteredTeam> {
  const team = await prisma.registeredTeam.update({
    where: { id: data.id },
    data: {
      tournament_id: data.tournamentId,
      name: data.name,
      players: data.players,
    },
  });

  if (!team) throw AppError.notFound('Команда не найдена');
  await updateTeamCount(data.tournamentId);
  return team;
}

export async function remove(id: number): Promise<void> {
  const team = await prisma.registeredTeam.delete({ where: { id } });
  if (!team) throw AppError.notFound('Команда не найдена');
  if (team.tournament_id) {
    await updateTeamCount(team.tournament_id);
  }
}

export async function removeByTournament(tournamentId: number): Promise<{ deleted: number }> {
  const result = await prisma.registeredTeam.deleteMany({
    where: { tournament_id: tournamentId },
  });
  await updateTeamCount(tournamentId);
  return { deleted: result.count };
}
