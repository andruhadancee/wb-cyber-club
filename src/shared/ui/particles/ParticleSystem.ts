interface Particle {
  img: HTMLImageElement | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

const PARTICLE_IMAGES = [
  '/images/Group 2131328333.png',
  '/images/Group 2131328334.png',
  '/images/Group 2131328335.png',
  '/images/Group 2131328336.png',
];

abstract class BaseParticleSystem {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected particles: Particle[] = [];
  protected animationId: number | null = null;
  protected images: HTMLImageElement[] = [];
  protected imagesLoaded = 0;
  protected totalImages = PARTICLE_IMAGES.length;
  protected isMobile: boolean;
  protected countBoost: number;
  protected speedBoost: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.isMobile = window.innerWidth <= 768;
    this.countBoost = this.isMobile ? 2.2 : 1;
    this.speedBoost = this.isMobile ? 4.2 : 1;

    this.resize();
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    this.loadImages();
  }

  private handleResize() {
    this.resize();
  }

  protected resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  protected loadImages() {
    PARTICLE_IMAGES.forEach((path) => {
      const img = new Image();
      img.onload = () => {
        this.imagesLoaded++;
        if (
          this.particles.length > 0 &&
          this.imagesLoaded === this.totalImages
        ) {
          this.assignImages();
        }
      };
      img.src = path;
      this.images.push(img);
    });
  }

  protected init() {
    const baseDiv = this.isMobile ? 14000 : 15000;
    const count = Math.floor(
      ((this.canvas.width * this.canvas.height) / baseDiv) * this.countBoost,
    );

    const maxSize = this.isMobile ? 12 : 15;
    const minSize = this.isMobile ? 5 : 7;
    const maxOpacity = this.isMobile ? 0.5 : 0.7;
    const minOpacity = this.isMobile ? 0.2 : 0.4;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        img: null,
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5 * this.speedBoost,
        vy: (Math.random() - 0.5) * 0.5 * this.speedBoost,
        size: Math.random() * (maxSize - minSize) + minSize,
        opacity: Math.random() * (maxOpacity - minOpacity) + minOpacity,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01 * (this.speedBoost * 2),
      });
    }

    if (this.imagesLoaded === this.totalImages) {
      this.assignImages();
    }
  }

  protected assignImages() {
    this.particles.forEach((p) => {
      if (!p.img) {
        p.img = this.images[Math.floor(Math.random() * this.images.length)];
      }
    });
  }

  protected draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.particles.length === 0) this.init();

    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

      p.x = Math.max(0, Math.min(this.canvas.width, p.x));
      p.y = Math.max(0, Math.min(this.canvas.height, p.y));

      p.rotation += p.rotationSpeed;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.globalAlpha = p.opacity;

      if (p.img && p.img.complete) {
        this.ctx.drawImage(p.img, -p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(139, 90, 191, ${p.opacity})`;
        this.ctx.fill();
      }

      this.ctx.restore();
    });

    if (this.imagesLoaded === this.totalImages) {
      this.assignImages();
    }

    // Линии между частицами
    const maxDist = this.isMobile ? 110 : 120;
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < maxDist) {
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          const alpha =
            (this.isMobile ? 0.16 : 0.26) * (1 - distance / maxDist);
          this.ctx.strokeStyle = `rgba(139, 90, 191, ${alpha})`;
          this.ctx.lineWidth = this.isMobile ? 1.0 : 1.1;
          this.ctx.stroke();
        }
      }
    }
  }

  protected animate() {
    this.draw();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  start() {
    this.animate();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    window.removeEventListener('resize', this.handleResize);
  }
}

export class ParticleSystem extends BaseParticleSystem {}

export class LoaderParticleSystem extends BaseParticleSystem {
  protected override loadImages() {
    super.loadImages();
    // Если изображения загружены быстро, инициализируем сразу
    const check = setInterval(() => {
      if (this.imagesLoaded === this.totalImages && this.particles.length === 0) {
        this.init();
        clearInterval(check);
      }
    }, 50);
    setTimeout(() => clearInterval(check), 5000);
  }
}
