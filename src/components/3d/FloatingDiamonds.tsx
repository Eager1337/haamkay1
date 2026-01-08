import { Suspense, lazy, useState, useEffect } from 'react';

const FloatingDiamondsCanvas = lazy(() => import('./FloatingDiamondsCanvas'));

export default function FloatingDiamonds() {
  const [mounted, setMounted] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || hasError) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      <Suspense fallback={null}>
        <FloatingDiamondsCanvas onError={() => setHasError(true)} />
      </Suspense>
    </div>
  );
}
