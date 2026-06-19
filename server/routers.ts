import { publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { dashboardRouter } from "./routers/dashboard";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
  }),
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
