import confetti from 'canvas-confetti';

export function fireConfetti() {
  // First burst - center
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#F97316', '#FBBF24', '#A855F7', '#3B82F6', '#22C55E'],
  });

  // Side bursts with slight delay
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#F97316', '#FBBF24', '#A855F7'],
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#3B82F6', '#22C55E', '#F97316'],
    });
  }, 150);
}

export function fireStars() {
  const defaults = {
    spread: 360,
    ticks: 100,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    shapes: ['star'] as const,
    colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8'],
  };

  confetti({
    ...defaults,
    particleCount: 40,
    scalar: 1.2,
    origin: { y: 0.5, x: 0.5 },
  });

  confetti({
    ...defaults,
    particleCount: 20,
    scalar: 0.75,
    origin: { y: 0.5, x: 0.5 },
  });
}

export function fireSchoolPride() {
  const end = Date.now() + 500;
  const colors = ['#F97316', '#FBBF24'];

  (function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}
