import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { useDisciplineStore } from '@/entities/discipline/model';
import type { Regulation } from '@/entities/regulation/types';

const schema = z.object({
  discipline_name: z.string().min(1, 'Выберите дисциплину'),
  regulation_name: z.string().optional(),
  pdf_url: z.string().url('Введите корректный URL').min(1, 'Обязательное поле'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  regulation?: Regulation | null;
  onSubmit: (data: FormValues & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

export function RegulationForm({ regulation, onSubmit, onCancel }: Props) {
  const { disciplines, fetchAll } = useDisciplineStore();

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: regulation
      ? {
          discipline_name: regulation.discipline_name,
          regulation_name: regulation.regulation_name || '',
          pdf_url: regulation.pdf_url,
        }
      : undefined,
  });

  const handleFormSubmit = async (data: FormValues) => {
    await onSubmit({ ...data, id: regulation?.id });
  };

  return (
    <form id="regulation-form" onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="form-group">
        <label htmlFor="regulation-discipline">Дисциплина *</label>
        <select id="regulation-discipline" {...register('discipline_name')}>
          <option value="">Выберите дисциплину</option>
          {disciplines.map((d) => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>
        {errors.discipline_name && <small style={{ color: '#ef4444' }}>{errors.discipline_name.message}</small>}
      </div>
      <div className="form-group">
        <label htmlFor="regulation-name">Название регламента</label>
        <input type="text" id="regulation-name" placeholder="Регламент сезона 2025" {...register('regulation_name')} />
        <p className="hint">Необязательно</p>
      </div>
      <div className="form-group">
        <label htmlFor="regulation-pdf-url">Ссылка на PDF *</label>
        <input type="text" id="regulation-pdf-url" placeholder="https://example.com/regulation.pdf" {...register('pdf_url')} />
        {errors.pdf_url && <small style={{ color: '#ef4444' }}>{errors.pdf_url.message}</small>}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onCancel}>Отмена</button>
        <button type="submit" className="btn-primary">Сохранить</button>
      </div>
    </form>
  );
}
