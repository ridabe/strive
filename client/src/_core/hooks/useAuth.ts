import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } =
    options ?? {};
  const utils = trpc.useUtils();
  const [sessionLoading, setSessionLoading] = useState(true);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    supabase.auth.getSession().then(() => setSessionLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      setSessionLoading(false);
      utils.auth.me.invalidate();
    });

    return () => subscription.unsubscribe();
  }, [utils]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    utils.auth.me.setData(undefined, null);
    await utils.auth.me.invalidate();
  }, [utils]);

  const loading = sessionLoading || meQuery.isLoading;

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (meQuery.data) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;
    window.location.href = redirectPath;
  }, [redirectOnUnauthenticated, redirectPath, loading, meQuery.data]);

  return {
    user: meQuery.data ?? null,
    loading,
    error: meQuery.error ?? null,
    isAuthenticated: Boolean(meQuery.data),
    refresh: () => meQuery.refetch(),
    logout,
  };
}
