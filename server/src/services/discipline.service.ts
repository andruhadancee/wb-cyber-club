import prisma from '../prisma';
import { AppError } from '../app-error';
import { cacheInvalidate } from '../cache';
import type { CreateDisciplineInput, UpdateDisciplineInput } from '../schemas/discipline.schema';
import type { Discipline } from '@prisma/client';

function invalidateCache(): void {
  cacheInvalidate('route:/api/disciplines');
}

export async function getAll(): Promise<Discipline[]> {
  return prisma.discipline.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function create(data: CreateDisciplineInput): Promise<Discipline> {
  try {
    const discipline = await prisma.discipline.create({
      data: {
        name: data.name.trim(),
        color: data.color || null,
        logo_url: data.logo_url || null,
      },
    });
    invalidateCache();
    return discipline;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      throw AppError.conflict('Дисциплина уже существует');
    }
    throw error;
  }
}

export async function update(data: UpdateDisciplineInput): Promise<Discipline> {
  const updateData: Record<string, unknown> = { updated_at: new Date() };
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.color !== undefined) updateData.color = data.color || null;
  if (data.logo_url !== undefined) updateData.logo_url = data.logo_url || null;

  const discipline = await prisma.discipline.update({
    where: { id: data.id },
    data: updateData,
  });

  if (!discipline) throw AppError.notFound('Дисциплина не найдена');
  invalidateCache();
  return discipline;
}

export async function removeByName(name: string): Promise<void> {
  const discipline = await prisma.discipline.findFirst({ where: { name } });
  if (!discipline) throw AppError.notFound('Дисциплина не найдена');

  await prisma.discipline.delete({ where: { id: discipline.id } });
  invalidateCache();
}
