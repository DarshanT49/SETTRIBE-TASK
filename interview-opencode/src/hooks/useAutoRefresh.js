import { useEffect } from 'react';

export function useAutoRefresh(refreshFn) {
  useEffect(() => {
    const handleUpdate = () => refreshFn();
    window.addEventListener('system-update', handleUpdate);
    return () => window.removeEventListener('system-update', handleUpdate);
  }, [refreshFn]);
}
