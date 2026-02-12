import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSocialLinkStore } from '@/entities/social-link/model';
import type { SocialLinks } from '@/entities/social-link/types';

export function SocialForm() {
  const { links, fetchAll, save } = useSocialLinkStore();
  const { register, handleSubmit, reset } = useForm<SocialLinks>();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    reset(links);
  }, [links, reset]);

  const onSubmit = async (data: SocialLinks) => {
    try {
      await save(data);
      alert('Социальные ссылки сохранены!');
    } catch (error) {
      alert('Ошибка: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="links-container">
      <h2>Настройка социальных кнопок</h2>
      <p className="hint">Укажите ссылки для кнопок в шапке сайта</p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="links-grid">
          <div className="link-item">
            <label>Twitch</label>
            <input type="text" className="social-input" placeholder="https://..." {...register('twitch')} />
          </div>
          <div className="link-item">
            <label>Telegram</label>
            <input type="text" className="social-input" placeholder="https://..." {...register('telegram')} />
          </div>
          <div className="link-item">
            <label>Discord</label>
            <input type="text" className="social-input" placeholder="https://..." {...register('discord')} />
          </div>
          <div className="link-item">
            <label>Связаться с нами</label>
            <input type="text" className="social-input" placeholder="https://..." {...register('contact')} />
          </div>
        </div>
        <button type="submit" className="btn-primary">Сохранить ссылки</button>
      </form>
    </div>
  );
}
