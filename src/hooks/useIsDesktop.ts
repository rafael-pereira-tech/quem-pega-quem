import { useEffect, useState } from 'react';

const QUERY = '(min-width: 1024px)';

/** true quando a viewport está em largura desktop (≥1024px). */
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  );
  useEffect(() => {
    const m = window.matchMedia(QUERY);
    const cb = () => setIsDesktop(m.matches);
    m.addEventListener('change', cb);
    return () => m.removeEventListener('change', cb);
  }, []);
  return isDesktop;
}
