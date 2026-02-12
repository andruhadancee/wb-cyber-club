import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/widgets/header/Header';
import { ParticleBackground } from '@/shared/ui/particles/ParticleBackground';
import { Loader } from '@/shared/ui/loader/Loader';

export function AppLayout() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 10000);
    // Скрыть лоадер, когда страница готова
    const handleReady = () => {
      clearTimeout(timeout);
      setLoading(false);
    };
    window.addEventListener('app-ready', handleReady);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('app-ready', handleReady);
    };
  }, []);

  return (
    <>
      {loading && <Loader text="Загрузка..." />}
      <ParticleBackground />
      <Header />
      <main className="container">
        <Outlet context={{ hideLoader: () => setLoading(false) }} />
      </main>
    </>
  );
}

/** Хук для скрытия лоадера из дочерних страниц */
export { useOutletContext } from 'react-router-dom';
