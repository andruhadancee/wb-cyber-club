import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { useDisciplineStore } from '@/entities/discipline/model';
import type { Tournament } from '@/entities/tournament/types';

const schema = z.object({
  title: z.string().min(1, 'Обязательное поле'),
  discipline: z.string().min(1, 'Выберите дисциплину'),
  date: z.string().min(1, 'Укажите дату'),
  prize: z.string().min(1, 'Укажите призовой фонд'),
  maxTeams: z.coerce.number().min(2).optional(),
  teams: z.coerce.number().min(0).optional(),
  customLink: z.string().optional(),
  startTime: z.string().optional(),
  watchUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  winner: z.string().optional(),
  status: z.enum(['active', 'finished']),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  tournament?: Tournament | null;
  isPast?: boolean;
  onSubmit: (data: FormValues & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

function parseDate(dateStr: string): string {
  const m = dateStr.match(/(\d+)\s+(\w+)\s+(\d+)/);
  if (m) {
    const months: Record<string, string> = {
      января: '01', февраля: '02', марта: '03', апреля: '04',
      мая: '05', июня: '06', июля: '07', августа: '08',
      сентября: '09', октября: '10', ноября: '11', декабря: '12',
    };
    return `${m[3]}-${months[m[2]] || '01'}-${m[1].padStart(2, '0')}`;
  }
  return dateStr;
}

export function TournamentForm({ tournament, isPast = false, onSubmit, onCancel }: Props) {
  const { disciplines, fetchAll } = useDisciplineStore();

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: tournament
      ? {
          title: tournament.title,
          discipline: tournament.discipline,
          date: parseDate(tournament.date),
          prize: tournament.prize,
          maxTeams: tournament.max_teams,
          teams: tournament.teams || 0,
          customLink: tournament.custom_link || '',
          startTime: tournament.start_time || '',
          watchUrl: tournament.watch_url || '',
          imageUrl: tournament.image_url || '',
          winner: tournament.winner || '',
          status: isPast ? 'finished' : 'active',
        }
      : { status: isPast ? 'finished' : 'active' },
  });

  const handleFormSubmit = async (data: FormValues) => {
    await onSubmit({ ...data, id: tournament?.id });
  };

  return (
    <form id="tournament-form" onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="form-group">
        <label htmlFor="tournament-name">Название турнира *</label>
        <input type="text" id="tournament-name" placeholder="Турнир 5X5 CS2" {...register('title')} />
        {errors.title && <small style={{ color: '#ef4444' }}>{errors.title.message}</small>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="tournament-discipline">Дисциплина *</label>
          <select id="tournament-discipline" {...register('discipline')}>
            <option value="">Выберите дисциплину</option>
            {disciplines.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
          {errors.discipline && <small style={{ color: '#ef4444' }}>{errors.discipline.message}</small>}
        </div>
        <div className="form-group">
          <label htmlFor="tournament-date">Дата турнира *</label>
          <input type="date" id="tournament-date" {...register('date')} />
        </div>
      </div>

      {!isPast && (
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="tournament-start-time">Время начала (МСК) *</label>
            <input type="time" id="tournament-start-time" {...register('startTime')} />
            <small>Время начала турнира по московскому времени</small>
          </div>
          <div className="form-group">
            <label htmlFor="tournament-prize">Призовой фонд *</label>
            <input type="text" id="tournament-prize" placeholder="25 000 ₽" {...register('prize')} />
          </div>
        </div>
      )}

      {isPast && (
        <div className="form-group">
          <label htmlFor="tournament-prize">Призовой фонд *</label>
          <input type="text" id="tournament-prize" placeholder="25 000 ₽" {...register('prize')} />
        </div>
      )}

      <div className="form-row">
        {!isPast && (
          <div className="form-group">
            <label htmlFor="tournament-max-teams">Максимум команд *</label>
            <input type="number" id="tournament-max-teams" placeholder="16" min="2" {...register('maxTeams')} />
          </div>
        )}
        {isPast && (
          <div className="form-group">
            <label htmlFor="tournament-teams">Количество участвующих команд *</label>
            <input type="number" id="tournament-teams" placeholder="12" min="0" {...register('teams')} />
            <small>Фактическое количество команд</small>
          </div>
        )}
      </div>

      {!isPast && (
        <div className="form-group">
          <label htmlFor="tournament-custom-link">Пользовательская ссылка</label>
          <input type="text" id="tournament-custom-link" placeholder="https://forms.gle/..." {...register('customLink')} />
          <small>Если не указана, будет использована ссылка из настроек</small>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="tournament-watch-url">Ссылка на трансляцию</label>
        <input type="text" id="tournament-watch-url" placeholder="https://twitch.tv/..." {...register('watchUrl')} />
        <small>Кнопка появится в момент старта</small>
      </div>

      <div className="form-group">
        <label htmlFor="tournament-image-url">Изображение турнира</label>
        <input type="text" id="tournament-image-url" placeholder="https://..." {...register('imageUrl')} />
        <small>Ссылка на изображение для архива</small>
      </div>

      {isPast && (
        <div className="form-group">
          <label htmlFor="tournament-winner">Победитель</label>
          <input type="text" id="tournament-winner" placeholder="Название команды-победителя" {...register('winner')} />
        </div>
      )}

      <input type="hidden" {...register('status')} />

      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onCancel}>Отмена</button>
        <button type="submit" className="btn-primary">Сохранить</button>
      </div>
    </form>
  );
}
