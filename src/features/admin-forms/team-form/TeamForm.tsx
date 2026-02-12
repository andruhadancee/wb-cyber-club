import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { useTournamentStore } from '@/entities/tournament/model';
import type { Team } from '@/entities/team/types';

const schema = z.object({
  tournamentId: z.coerce.number().min(1, 'Выберите турнир'),
  name: z.string().min(1, 'Введите название команды'),
  players: z.coerce.number().min(1, 'Минимум 1 игрок'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  team?: Team | null;
  onSubmit: (data: FormValues & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

export function TeamForm({ team, onSubmit, onCancel }: Props) {
  const { activeTournaments, fetchActive } = useTournamentStore();

  useEffect(() => { fetchActive(); }, [fetchActive]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: team
      ? { tournamentId: team.tournament_id, name: team.name, players: team.players }
      : undefined,
  });

  const handleFormSubmit = async (data: FormValues) => {
    await onSubmit({ ...data, id: team?.id });
  };

  return (
    <form id="team-form" onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="form-group">
        <label htmlFor="team-tournament">Турнир *</label>
        <select id="team-tournament" {...register('tournamentId')}>
          <option value="">Выберите турнир</option>
          {activeTournaments.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
        {errors.tournamentId && <small style={{ color: '#ef4444' }}>{errors.tournamentId.message}</small>}
      </div>
      <div className="form-group">
        <label htmlFor="team-name">Название команды *</label>
        <input type="text" id="team-name" placeholder="Team Spirit" {...register('name')} />
        {errors.name && <small style={{ color: '#ef4444' }}>{errors.name.message}</small>}
      </div>
      <div className="form-group">
        <label htmlFor="team-players">Количество игроков *</label>
        <input type="number" id="team-players" placeholder="5" min="1" {...register('players')} />
        {errors.players && <small style={{ color: '#ef4444' }}>{errors.players.message}</small>}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onCancel}>Отмена</button>
        <button type="submit" className="btn-primary">Сохранить</button>
      </div>
    </form>
  );
}
