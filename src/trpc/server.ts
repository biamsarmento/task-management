// server-side tRPC helpers for ssr prefetching and direct procedure calls
import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { cache } from "react";
import { appRouter } from "@/server/routers/_app";
import type { AppRouter } from "@/server/routers/_app";
import { makeQueryClient } from "./query-client";

// react cache makes sure we get one query client per request
const getQueryClient = cache(makeQueryClient);

// caller is used when we need data directly in a server component (e.g. edit page)
export const caller = appRouter.createCaller({});

// api here is the ssr version — used for prefetch() calls in page.tsx files
export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient
);
