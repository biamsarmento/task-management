import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { cache } from "react";
import { appRouter } from "@/server/routers/_app";
import type { AppRouter } from "@/server/routers/_app";
import { makeQueryClient } from "./query-client";

const getQueryClient = cache(makeQueryClient);
export const caller = appRouter.createCaller({});

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient
);
