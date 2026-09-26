import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  me,
  refresh,
  stationCashierLogin,
  type StationCashierLoginPayload
} from "@/features/auth/services/auth.api";
import { preserveStationAssignment } from "@/features/auth/preserve-station-assignment";
import {
  setApiAccessToken,
  setRefreshTokenHandler,
  toApiError
} from "@/services/api/client";
import { zustandStorage } from "@/services/storage/mmkv";
import { useSessionStore } from "@/store/session.store";
import type { StationUser } from "@/types/user";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: StationUser | null;
  isAuthenticated: boolean;
  isBootstrapped: boolean;
  isBootstrapping: boolean;
  isLoginLoading: boolean;
  authError: string | null;
  login: (payload: StationCashierLoginPayload) => Promise<void>;
  logout: () => void;
  bootstrap: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  clearAuthError: () => void;
};

function setAuthenticatedCredentials(
  set: (state: Partial<AuthState>) => void,
  session: {
    accessToken: string;
    refreshToken: string;
    user: StationUser;
  }
) {
  setApiAccessToken(session.accessToken);
  set({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: session.user,
    authError: null
  });
}

function clearAuthenticatedSession(set: (state: Partial<AuthState>) => void) {
  setApiAccessToken(null);
  set({
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false
  });
  useSessionStore.getState().clearSession();
}

function isCashier(user: StationUser) {
  return String(user.role).toUpperCase() === "CASHIER";
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isBootstrapped: false,
      isBootstrapping: false,
      isLoginLoading: false,
      authError: null,
      login: async (payload) => {
        set({ isLoginLoading: true, authError: null });

        try {
          const session = await stationCashierLogin(payload);

          if (!isCashier(session.user)) {
            throw new Error("Ce compte n'est pas autorisé à utiliser l'application cashier.");
          }

          setAuthenticatedCredentials(set, session);
          await useSessionStore.getState().restoreCurrentSession(session.user);
          set({ isAuthenticated: true });
        } catch (error) {
          const apiError = toApiError(error);
          set({ authError: apiError.message });
          throw apiError;
        } finally {
          set({ isLoginLoading: false });
        }
      },
      logout: () => {
        clearAuthenticatedSession(set);
      },
      bootstrap: async () => {
        if (get().isBootstrapping) {
          return;
        }

        const { accessToken, refreshToken, user: persistedUser } = get();

        if (!accessToken || !refreshToken) {
          clearAuthenticatedSession(set);
          set({ isBootstrapped: true, isBootstrapping: false });
          return;
        }

        set({ isBootstrapping: true, authError: null });
        setApiAccessToken(accessToken);

        try {
          const currentUser = preserveStationAssignment(await me(), persistedUser);

          if (!isCashier(currentUser)) {
            clearAuthenticatedSession(set);
            set({ isBootstrapped: true });
            return;
          }

          await useSessionStore.getState().restoreCurrentSession(currentUser);
          set({
            user: currentUser,
            isAuthenticated: true,
            isBootstrapped: true
          });
        } catch {
          const nextAccessToken = await get().refreshAccessToken();

          if (!nextAccessToken) {
            clearAuthenticatedSession(set);
            set({ isBootstrapped: true });
            return;
          }

          try {
            const currentUser = preserveStationAssignment(await me(), get().user);

            if (!isCashier(currentUser)) {
              clearAuthenticatedSession(set);
              set({ isBootstrapped: true });
              return;
            }

            await useSessionStore.getState().restoreCurrentSession(currentUser);
            set({
              user: currentUser,
              isAuthenticated: true,
              isBootstrapped: true
            });
          } catch {
            clearAuthenticatedSession(set);
            set({ isBootstrapped: true });
          }
        } finally {
          set({ isBootstrapping: false });
        }
      },
      refreshAccessToken: async () => {
        const currentRefreshToken = get().refreshToken;

        if (!currentRefreshToken) {
          clearAuthenticatedSession(set);
          return null;
        }

        try {
          const tokens = await refresh(currentRefreshToken);
          setApiAccessToken(tokens.accessToken);
          set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isAuthenticated: true
          });
          return tokens.accessToken;
        } catch {
          clearAuthenticatedSession(set);
          return null;
        }
      },
      clearAuthError: () => {
        set({ authError: null });
      }
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        setApiAccessToken(state?.accessToken ?? null);
      }
    }
  )
);

setRefreshTokenHandler(async () => {
  return useAuthStore.getState().refreshAccessToken();
});
