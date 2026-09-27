import { useQuery } from '@tanstack/react-query';
import { fetchGuestScenarios } from '../api';

export const GUEST_SCENARIOS_KEY = ['guest-scenarios'] as const;

export function useGuestScenarios(enabled = true) {
  return useQuery({
    queryKey: GUEST_SCENARIOS_KEY,
    queryFn: fetchGuestScenarios,
    staleTime: 60 * 60_000,
    enabled,
  });
}
