import { useEffect, useRef } from 'react';
import { ParticleSystem } from './ParticleSystem';

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const systemRef = useRef<ParticleSystem | null>(null);

  useEffect(() => {
    if (canvasRef.current && !systemRef.current) {
      systemRef.current = new ParticleSystem(canvasRef.current);
      systemRef.current.start();
    }
    return () => {
      systemRef.current?.stop();
      systemRef.current = null;
    };
  }, []);

  return (
    <div className="animated-bg">
      <canvas ref={canvasRef} id="particles-canvas" />
    </div>
  );
}
