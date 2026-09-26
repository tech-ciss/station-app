import type { StationUser } from "@/types/user";

export function preserveStationAssignment(
  currentUser: StationUser,
  persistedUser: StationUser | null
): StationUser {
  if (!persistedUser || persistedUser.id !== currentUser.id) {
    return currentUser;
  }

  return {
    ...currentUser,
    stationId: currentUser.stationId ?? persistedUser.stationId,
    stationName: currentUser.stationName ?? persistedUser.stationName,
    stationCode: currentUser.stationCode ?? persistedUser.stationCode
  };
}
