import { useEffect, useState } from 'react';
import { getOrCreateDeviceId } from '../utils/device';

export const useDeviceId = () => {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const id = await getOrCreateDeviceId();
      if (!cancelled) {
        setDeviceId(id);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { deviceId, loading } as const;
};
