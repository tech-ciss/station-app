import type { StationSession } from "@/types/session";

export const appRoutes = {
  login: "/(auth)/login",
  selectPump: "/(session)/select-pump",
  scan: "/(session)/scan",
  history: "/(tabs)/history",
  service: "/(tabs)/service",
  profile: "/(tabs)/profile"
} as const;

type NavigationState = {
  isAuthenticated: boolean;
  currentSession: StationSession | null;
};

export type NavigationAccess = {
  auth: boolean;
  pumpSelection: boolean;
  sessionFeatures: boolean;
};

export function hasActiveSession(currentSession: StationSession | null) {
  return currentSession?.isActive === true;
}

export function canAccessSessionFeatures(state: NavigationState) {
  return state.isAuthenticated && hasActiveSession(state.currentSession);
}

export function requiresPumpSelection(state: NavigationState) {
  return state.isAuthenticated && !hasActiveSession(state.currentSession);
}

export function getNavigationAccess(state: NavigationState): NavigationAccess {
  return {
    auth: !state.isAuthenticated,
    pumpSelection: requiresPumpSelection(state),
    sessionFeatures: canAccessSessionFeatures(state)
  };
}
