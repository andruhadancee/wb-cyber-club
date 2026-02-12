import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { useDisciplineStore } from '@/entities/discipline/model';
import type { CalendarEvent } from '@/entities/calendar-event/types';

const schema = z.object({
  title: z.string().min(1, 'Обязательное поле'),
  eventDate: z.string().min(1, 'Укажите дату'),
  discipline: z.string().optional(),
  startTime: z.string().optional(),
  prize: z.string().optional(),
  maxTeams: z.coerce.number().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  registrationLink: z.string().optional(),
  customLink: z.string().optional(),
  watchUrl: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  event?: CalendarEvent | null;
  defaultDate?: string;
  onSubmit: (data: FormValues & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

export function CalendarEventForm({ event, defaultDate, onSubmit, onCancel }: Props) {
  const { disciplines, fetchAll } = useDisciplineStore();

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: event
      ? {
          title: event.title,
          eventDate: (event.event_date || '').slice(0, 10),
          discipline: event.discipline || '',
          startTime: event.start_time || '',
          prize: event.prize || '',
          maxTeams: event.max_teams || undefined,
          description: event.description || '',
          imageUrl: event.image_url || '',
          registrationLink: event.registration_link || '',
          customLink: event.custom_link || '',
          watchUrl: event.watch_url || '',
        }
      : { eventDate: defaultDate || '' },
  });

  const handleFormSubmit = async (data: FormValues) => {
    await onSubmit({ ...data, id: event?.id });
  };

  return (
    <form id="calendar-event-form" onSubmit={handleSubmit(handleFormSubmit)} style={{ padding: '16px 24px' }}>
      <div className="form-group">
        <label htmlFor="calendar-title">Название турнира *</label>
        <input type="text" id="calendar-title" placeholder="Турнир 5х5 CS2" {...register('title')} />
        {errors.title && <small style={{ color: '#ef4444' }}>{errors.title.message}</small>}
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="calendar-discipline">Дисциплина</label>
          <select id="calendar-discipline" {...register('discipline')}>
            <option value="">Выберите дисциплину</option>
            {disciplines.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="calendar-date">Дата *</label>
          <input type="date" id="calendar-date" {...register('eventDate')} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="calendar-start-time">Время начала (МСК)</label>
          <input type="time" id="calendar-start-time" {...register('startTime')} />
        </div>
        <div className="form-group">
          <label htmlFor="calendar-prize">Призовой фонд</label>
          <input type="text" id="calendar-prize" placeholder="100 000 ₽" {...register('prize')} />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="calendar-max-teams">Количество команд</label>
        <input type="number" id="calendar-max-teams" placeholder="16" min="2" {...register('maxTeams')} />
      </div>
      <div className="form-group">
        <label htmlFor="calendar-description">Описание</label>
        <textarea id="calendar-description" rows={3} placeholder="Краткое описание" {...register('description')} />
      </div>
      <div className="form-group">
        <label htmlFor="calendar-image">Картинка (URL)</label>
        <input type="text" id="calendar-image" placeholder="https://..." {...register('imageUrl')} />
      </div>
      <div className="form-group">
        <label htmlFor="calendar-registration-link">Ссылка на регистрацию</label>
        <input type="text" id="calendar-registration-link" placeholder="https://forms.gle/..." {...register('registrationLink')} />
      </div>
      <div className="form-group">
        <label htmlFor="calendar-custom-link">Пользовательская ссылка</label>
        <input type="text" id="calendar-custom-link" placeholder="https://..." {...register('customLink')} />
      </div>
      <div className="form-group">
        <label htmlFor="calendar-watch-url">Ссылка на трансляцию</label>
        <input type="text" id="calendar-watch-url" placeholder="https://twitch.tv/..." {...register('watchUrl')} />
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onCancel}>Отмена</button>
        <button type="submit" className="btn-primary">Сохранить</button>
      </div>
    </form>
  );
}
