import prisma from '../prisma';
import { AppError } from '../app-error';
import type { CreateRegulationInput, UpdateRegulationInput } from '../schemas/regulation.schema';

const INCLUDE_DISCIPLINE = { discipline: { select: { id: true, name: true } } } as const;

function flattenRegulation(r: any) {
  const { discipline: disc, ...rest } = r;
  return { ...rest, discipline_name: disc.name };
}

export async function getAll(disciplineId?: number) {
  const where = disciplineId ? { discipline_id: disciplineId } : {};

  const regulations = await prisma.regulation.findMany({
    where,
    include: INCLUDE_DISCIPLINE,
    orderBy: [{ discipline_id: 'asc' }, { regulation_name: 'asc' }],
  });

  return regulations.map(flattenRegulation);
}

export async function create(data: CreateRegulationInput) {
  const reg = await prisma.regulation.create({
    data: {
      discipline_id: data.disciplineId,
      pdf_url: data.pdf_url,
      regulation_name: data.regulation_name || null,
    },
    include: INCLUDE_DISCIPLINE,
  });

  return flattenRegulation(reg);
}

export async function update(id: number, data: UpdateRegulationInput) {
  const regulation = await prisma.regulation.update({
    where: { id },
    data: {
      pdf_url: data.pdf_url,
      discipline_id: data.disciplineId,
      regulation_name: data.regulation_name,
      updated_at: new Date(),
    },
    include: INCLUDE_DISCIPLINE,
  });

  if (!regulation) throw AppError.notFound('Regulation not found');
  return flattenRegulation(regulation);
}

export async function remove(id: number): Promise<void> {
  const regulation = await prisma.regulation.findUnique({ where: { id } });
  if (!regulation) throw AppError.notFound('Regulation not found');
  await prisma.regulation.delete({ where: { id } });
}
