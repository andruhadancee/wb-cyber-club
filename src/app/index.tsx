import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Ленивый чанк не догрузился (сеть моргнула, деплой сменил хеши, старый HTML из кеша) —
// тихо перезагружаемся на свежую версию вместо чёрного экрана «Failed to fetch module».
// ponytail: не чаще раза в 10с, иначе реально мёртвый чанк зациклит reload.
window.addEventListener('vite:preloadError', () => {
  const KEY = 'vite:preloadReloadAt';
  const last = Number(sessionStorage.getItem(KEY) || 0);
  if (Date.now() - last > 10_000) {
    sessionStorage.setItem(KEY, String(Date.now()));
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
