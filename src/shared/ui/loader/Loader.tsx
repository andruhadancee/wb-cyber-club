import { useEffect, useRef, useState } from 'react';
import { LoaderParticleSystem } from '../particles/ParticleSystem';

interface LoaderProps {
  text?: string;
}

export function Loader({ text = 'Загрузка...' }: LoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const systemRef = useRef<LoaderParticleSystem | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (canvasRef.current && !systemRef.current) {
      systemRef.current = new LoaderParticleSystem(canvasRef.current);
      systemRef.current.start();
    }
    return () => {
      systemRef.current?.stop();
      systemRef.current = null;
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      className={`loader-container${hidden ? ' hidden' : ''}`}
      id="loader"
      onTransitionEnd={() => setHidden(true)}
    >
      <canvas ref={canvasRef} />
      <div className="loader">
        <div className="loader-gamepad">🎮</div>
        <div className="loader-gamepad">🎮</div>
        <div className="loader-gamepad">🎮</div>
      </div>
      <div className="loader-text">{text}</div>
    </div>
  );
}

/** Хук для управления лоадером */
export function useLoader() {
  const [loading, setLoading] = useState(true);
  const hide = () => setLoading(false);
  return { loading, hide } as const;
}
