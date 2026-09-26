import { useMemo } from "react";

import { useAuthStore } from "@/store/auth.store";
import { useSessionStore } from "@/store/session.store";

export function useNavigationState() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentSession = useSessionStore((state) => state.currentSession);

  return useMemo(
    () => ({
      isAuthenticated,
      currentSession
    }),
    [currentSession, isAuthenticated]
  );
}
