import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParticleBackground } from '@/shared/ui/particles/ParticleBackground';
import { Loader } from '@/shared/ui/loader/Loader';
import { AdminPanel } from '@/widgets/admin-panel/AdminPanel';

export function AdminPage() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAdmin = localStorage.getItem('wbcyber_admin') === 'true';
    if (!isAdmin) {
      const password = prompt('Введите пароль администратора:');
      if (password === 'admin123') {
        localStorage.setItem('wbcyber_admin', 'true');
        setAuthorized(true);
      } else {
        alert('Неверный пароль!');
        navigate('/');
        return;
      }
    } else {
      setAuthorized(true);
    }
    setLoading(false);
  }, [navigate]);

  if (!authorized) return null;

  return (
    <>
      {loading && <Loader text="Загрузка панели..." />}
      <ParticleBackground />
      <header>
        <div className="container">
          <a href="/" className="logo">
            <img src="/images/cyberclub-logo.png" alt="WB Cyber Club" className="logo-image" />
          </a>
        </div>
      </header>
      <main className="container">
        <AdminPanel />
      </main>
    </>
  );
}
