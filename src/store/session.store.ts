import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  closeWorkSession,
  fetchCurrentWorkSession,
  startWorkSession
} from "@/features/station-session/services/station-session.api";
import { toApiError } from "@/services/api/client";
import { zustandStorage } from "@/services/storage/mmkv";
import type { Pump, StationSession } from "@/types/session";
import type { StationUser } from "@/types/user";

type OpenSessionPayload = {
  pumpId: string;
  pumpName?: string;
  cashierId: string;
  stationId?: string;
  stationName?: string;
};

type StationContext = {
  id: string;
  name?: string;
};

type SessionState = {
  currentSession: StationSession | null;
  stationContext: StationContext | null;
  selectedPump: Pump | null;
  isOpeningSession: boolean;
  sessionError: string | null;
  selectPump: (pump: Pump) => void;
  clearSelectedPump: () => void;
  openSession: (payload: OpenSessionPayload) => Promise<void>;
  restoreCurrentSession: (user?: StationUser | null) => Promise<void>;
  closeSession: () => Promise<void>;
  clearSession: () => void;
  clearSessionError: () => void;
};

function isSessionAlreadyClosedError(error: unknown) {
  const apiError = toApiError(error);
  const message = apiError.message.toLowerCase();

  return (
    apiError.status === 404 ||
    message.includes("already closed") ||
    message.includes("not open") ||
    message.includes("no open work session") ||
    message.includes("aucune session ouverte")
  );
}

async function getClosableSessionId(session: StationSession) {
  const response = await fetchCurrentWorkSession();
  return response.session?.isActive ? response.session.id ?? session.id ?? null : null;
}

async function confirmSessionClosed() {
  const response = await fetchCurrentWorkSession();
  return response.session?.isActive ? response.session : null;
}

function setActiveSession(set: (state: Partial<SessionState>) => void, session: StationSession) {
  set({
    currentSession: session,
    stationContext: {
      id: session.stationId,
      name: session.stationName
    },
    selectedPump: {
      id: session.pumpId,
      name: session.pumpName,
      status: "AVAILABLE"
    }
  });
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      currentSession: null,
      stationContext: null,
      selectedPump: null,
      isOpeningSession: false,
      sessionError: null,
      selectPump: (pump) => {
        set({ selectedPump: pump, sessionError: null });
      },
      clearSelectedPump: () => {
        set({ selectedPump: null });
      },
      openSession: async ({ pumpId, pumpName, cashierId, stationId, stationName }) => {
        if (!stationId) {
          const message = "Station introuvable pour ce cashier.";
          set({ sessionError: message });
          throw new Error(message);
        }

        set({ isOpeningSession: true, sessionError: null });

        try {
          const session = await startWorkSession(
            {
              stationId,
              pumpId
            },
            {
              id: cashierId,
              name: cashierId,
              phone: "",
              role: "CASHIER",
              stationId,
              stationName
            }
          );

          set({
            stationContext: {
              id: session.stationId,
              name: session.stationName
            },
            selectedPump: {
              id: session.pumpId,
              name: session.pumpName,
              status: "AVAILABLE"
            },
            currentSession: session,
            isOpeningSession: false,
            sessionError: null
          });
        } catch (error) {
          const message = toApiError(error).message;

          set({
            isOpeningSession: false,
            sessionError: message
          });
          throw error;
        }
      },
      restoreCurrentSession: async (user) => {
        try {
          const response = await fetchCurrentWorkSession(user);

          if (!response.session?.isActive) {
            set({ currentSession: null, selectedPump: null });
            return;
          }

          set({
            currentSession: response.session,
            stationContext: {
              id: response.session.stationId,
              name: response.session.stationName
            },
            selectedPump: {
              id: response.session.pumpId,
              name: response.session.pumpName,
              status: "AVAILABLE"
            },
            sessionError: null
          });
        } catch {
          set({ currentSession: null });
        }
      },
      closeSession: async () => {
        const session = useSessionStore.getState().currentSession;

        if (!session) {
          set({ currentSession: null, selectedPump: null, sessionError: null });
          return;
        }

        set({ sessionError: null });

        try {
          const sessionId = await getClosableSessionId(session);

          if (!sessionId) {
            set({ currentSession: null, selectedPump: null, sessionError: null });
            return;
          }

          await closeWorkSession(sessionId);

          const activeSession = await confirmSessionClosed();

          if (activeSession) {
            const message = "La session est encore active côté serveur. Réessayez la fermeture.";
            setActiveSession(set, activeSession);
            set({ sessionError: message });
            throw new Error(message);
          }

          set({ currentSession: null, selectedPump: null, sessionError: null });
        } catch (error) {
          if (isSessionAlreadyClosedError(error)) {
            try {
              const response = await fetchCurrentWorkSession();

              if (!response.session?.isActive) {
                set({ currentSession: null, selectedPump: null, sessionError: null });
                return;
              }

              setActiveSession(set, response.session);
            } catch {
              set({ currentSession: null, selectedPump: null, sessionError: null });
              return;
            }
          }

          const message = toApiError(error).message;
          set({ sessionError: message });
          throw error;
        }
      },
      clearSession: () => {
        set({
          currentSession: null,
          stationContext: null,
          selectedPump: null
        });
      },
      clearSessionError: () => {
        set({ sessionError: null });
      }
    }),
    {
      name: "session-store",
      version: 2,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<SessionState>;

        return {
          ...state,
          stationContext:
            state.stationContext ??
            (state.currentSession
              ? {
                  id: state.currentSession.stationId,
                  name: state.currentSession.stationName
                }
              : null),
          selectedPump:
            state.selectedPump && typeof state.selectedPump === "object"
              ? state.selectedPump
              : null
        };
      },
      storage: createJSONStorage(() => zustandStorage)
    }
  )
);
