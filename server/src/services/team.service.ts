import prisma from '../prisma';
import { AppError } from '../app-error';
import type { CreateTeamInput, UpdateTeamInput } from '../schemas/team.schema';
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

export async function getAll(tournamentId?: number): Promise<TeamsByTournament> {
  const where = tournamentId ? { tournament_id: tournamentId } : {};
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
