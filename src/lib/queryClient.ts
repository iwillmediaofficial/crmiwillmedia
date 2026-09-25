import { QueryClient } from '@tanstack/react-query'

/**
 * Free-tier optimized TanStack Query client.
 * Caches data intelligently to minimize database roundtrips and Supabase API calls.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes fresh cache
      gcTime: 1000 * 60 * 15,    // 15 minutes in memory
      refetchOnWindowFocus: false, // Prevents excessive queries on tab switching
      retry: 1,
    },
  },
})
