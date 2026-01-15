/**
 * Système d'interactions - Feedback visuel, sons, vibrations
 * Rend l'application vivante et engageante
 */

// Vibration patterns
export const vibrate = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
  },
  notification: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30]);
    }
  }
};

// Sons avec Web Audio API (simples)
class SoundManager {
  private context: AudioContext | null = null;

  private getContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.context;
  }

  private playTone(frequency: number, duration: number, volume: number = 0.1) {
    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      // Silent fail si audio non supporté
    }
  }

  click() {
    this.playTone(800, 0.05, 0.05);
  }

  tap() {
    this.playTone(600, 0.03, 0.03);
  }

  success() {
    this.playTone(800, 0.1, 0.08);
    setTimeout(() => this.playTone(1000, 0.15, 0.08), 80);
  }

  error() {
    this.playTone(400, 0.15, 0.08);
    setTimeout(() => this.playTone(300, 0.15, 0.08), 100);
  }

  notification() {
    this.playTone(900, 0.08, 0.06);
    setTimeout(() => this.playTone(1100, 0.08, 0.06), 100);
  }

  payment() {
    this.playTone(600, 0.08);
    setTimeout(() => this.playTone(800, 0.08), 100);
    setTimeout(() => this.playTone(1000, 0.15), 200);
  }
}

export const sound = new SoundManager();

// Feedback combiné (son + vibration)
export const feedback = {
  tap: () => {
    sound.tap();
    vibrate.light();
  },
  
  click: () => {
    sound.click();
    vibrate.medium();
  },

  success: () => {
    sound.success();
    vibrate.success();
  },

  error: () => {
    sound.error();
    vibrate.error();
  },

  notification: () => {
    sound.notification();
    vibrate.notification();
  },

  payment: () => {
    sound.payment();
    vibrate.success();
  }
};

// Confetti effect
export const showConfetti = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);
    
    // Create particles with CSS
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'fixed';
      particle.style.width = '10px';
      particle.style.height = '10px';
      particle.style.backgroundColor = ['#16a34a', '#eab308', '#ef4444', '#3b82f6'][Math.floor(Math.random() * 4)];
      particle.style.left = randomInRange(0, 100) + '%';
      particle.style.top = '-10px';
      particle.style.borderRadius = '50%';
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '9999';
      particle.style.transition = 'all 3s ease-out';
      
      document.body.appendChild(particle);

      setTimeout(() => {
        particle.style.top = randomInRange(100, 120) + '%';
        particle.style.left = (parseFloat(particle.style.left) + randomInRange(-30, 30)) + '%';
        particle.style.opacity = '0';
      }, 50);

      setTimeout(() => {
        document.body.removeChild(particle);
      }, 3000);
    }
  }, 250);
};

// Animations de liste (stagger)
export const staggerAnimation = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }
};

// Shake animation pour erreurs
export const shakeElement = (element: HTMLElement) => {
  element.style.animation = 'shake 0.5s';
  setTimeout(() => {
    element.style.animation = '';
  }, 500);
};

// Pulse animation pour attirer l'attention
export const pulseElement = (element: HTMLElement) => {
  element.style.animation = 'pulse 1s infinite';
};

export const stopPulse = (element: HTMLElement) => {
  element.style.animation = '';
};
