import { QueryClient } from "@tanstack/react-query";

// 30s stale time so we don't refetch on every focus/mount
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
    },
  });
}
