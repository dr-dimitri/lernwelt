import { useEffect, useState } from 'react';

const EARTH_YEAR_SECONDS = 5;

export default function useSolarOrbit() {
  const [running, setRunning] = useState(false);
  const [earthYears, setEarthYears] = useState(0);

  useEffect(() => {
    if (!running) return;
    let frame: number | null = null;
    let previousTime = performance.now();

    function tick(time: number) {
      const elapsed = Math.max(0, time - previousTime);
      previousTime = time;
      setEarthYears((years) => years + elapsed / (EARTH_YEAR_SECONDS * 1000));
      frame = requestAnimationFrame(tick);
    }

    function visibilityChanged() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      if (!document.hidden) {
        // Hidden time never advances the planets or causes a jump on return.
        previousTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }

    visibilityChanged();
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', visibilityChanged);
    };
  }, [running]);

  return {
    running,
    setRunning,
    earthYears,
  };
}
