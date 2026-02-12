import prisma from '../prisma';
import { AppError } from '../app-error';
import type { CreateRegulationInput, UpdateRegulationInput } from '../schemas/regulation.schema';
import type { Regulation } from '@prisma/client';

export async function getAll(discipline?: string): Promise<Regulation[]> {
  if (discipline) {
    return prisma.regulation.findMany({
      where: { discipline_name: { equals: discipline, mode: 'insensitive' } },
    });
  }

  return prisma.regulation.findMany({
    orderBy: [{ discipline_name: 'asc' }, { regulation_name: 'asc' }],
  });
}

export async function create(data: CreateRegulationInput): Promise<Regulation> {
  return prisma.regulation.create({
    data: {
      discipline_name: data.discipline_name,
      pdf_url: data.pdf_url,
      regulation_name: data.regulation_name || null,
    },
  });
}

export async function update(id: number, data: UpdateRegulationInput): Promise<Regulation> {
  const regulation = await prisma.regulation.update({
    where: { id },
    data: {
      pdf_url: data.pdf_url,
      discipline_name: data.discipline_name,
      regulation_name: data.regulation_name,
      updated_at: new Date(),
    },
  });

  if (!regulation) throw AppError.notFound('Regulation not found');
  return regulation;
}

export async function remove(id: number): Promise<void> {
  const regulation = await prisma.regulation.findUnique({ where: { id } });
  if (!regulation) throw AppError.notFound('Regulation not found');
  await prisma.regulation.delete({ where: { id } });
}
