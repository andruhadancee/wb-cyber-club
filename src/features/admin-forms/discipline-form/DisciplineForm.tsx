import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Discipline } from '@/entities/discipline/types';

const schema = z.object({
  name: z.string().min(1, 'Введите название'),
  color: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  discipline?: Discipline | null;
  onSubmit: (data: FormValues & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

export function DisciplineForm({ discipline, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: discipline
      ? { name: discipline.name, color: discipline.color || '#8b5abf' }
      : { color: '#8b5abf' },
  });

  const handleFormSubmit = async (data: FormValues) => {
    await onSubmit({ ...data, id: discipline?.id });
  };

  return (
    <form id="discipline-edit-form" onSubmit={handleSubmit(handleFormSubmit)} style={{ padding: '16px 24px' }}>
      <div className="form-group">
        <label htmlFor="discipline-edit-name">Название дисциплины *</label>
        <input type="text" id="discipline-edit-name" {...register('name')} />
        {errors.name && <small style={{ color: '#ef4444' }}>{errors.name.message}</small>}
      </div>
      <div className="form-group">
        <label htmlFor="discipline-edit-color">Цвет дисциплины</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="color" id="discipline-edit-color" {...register('color')} style={{ width: 60, height: 40, cursor: 'pointer', borderRadius: 4 }} />
        </div>
        <small>Цвет для календаря и фильтров</small>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onCancel}>Отмена</button>
        <button type="submit" className="btn-primary">Сохранить</button>
      </div>
    </form>
  );
}
