import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { createSupabaseServerClient } from "./supabase";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const authHeader = opts.req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const supabase = createSupabaseServerClient();
      const {
        data: { user: supabaseUser },
        error,
      } = await supabase.auth.getUser(token);

      if (!error && supabaseUser) {
        user = (await db.getUserBySupabaseId(supabaseUser.id)) ?? null;

        if (!user) {
          await db.upsertUser({
            supabaseId: supabaseUser.id,
            email: supabaseUser.email ?? null,
            name: supabaseUser.user_metadata?.name ?? null,
            lastSignedIn: new Date(),
          });
          user = (await db.getUserBySupabaseId(supabaseUser.id)) ?? null;
        } else {
          await db.upsertUser({
            supabaseId: user.supabaseId,
            lastSignedIn: new Date(),
          });
        }
      }
    }
  } catch {
    user = null;
  }

  return { req: opts.req, res: opts.res, user };
}
