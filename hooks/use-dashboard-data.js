'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '@/lib/api-client';
const empty = { projects: [], deployments: [], databases: [], functions: [], cronjobs: [], projectStats: null, systemHealth: [], recentActivity: [], metrics: null };
export function useDashboardData(pollingInterval = 30000) {
  const [state, setState] = useState({ ...empty, loading: true, refreshing: false, error: null, lastUpdate: null });
  const live = useRef(false);
  const busy = useRef(false);
  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    if (live.current) setState(s => ({ ...s, refreshing: true }));
    try {
      const data = await apiClient.getDashboardData();
      if (live.current) setState({ ...empty, ...data, loading: false, refreshing: false, error: null, lastUpdate: data.observedAt || new Date().toISOString() });
    } catch (error) {
      if (live.current) setState(s => ({ ...s, loading: false, refreshing: false, error }));
    } finally { busy.current = false; }
  }, []);
  useEffect(() => {
    live.current = true;
    refresh();
    const timer = pollingInterval > 0 ? setInterval(refresh, pollingInterval) : null;
    return () => { live.current = false; if (timer) clearInterval(timer); };
  }, [refresh, pollingInterval]);
  return { ...state, refresh };
}
