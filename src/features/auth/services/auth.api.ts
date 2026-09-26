import { apiClient } from "@/services/api/client";
import type { StationUser } from "@/types/user";

export type StationCashierLoginPayload = {
  stationCode: string;
  phone: string;
  pin: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: StationUser;
};

type BackendAuthResponse = Partial<AuthSession> & {
  token?: string;
  access_token?: string;
  refresh_token?: string;
  station?: { id?: string; name?: string; stationCode?: string };
  assignment?: { stationId?: string; station?: { id?: string; name?: string; stationCode?: string } };
  stationAssignment?: { stationId?: string; station?: { id?: string; name?: string; stationCode?: string } };
  data?: Partial<AuthSession> & {
    token?: string;
    access_token?: string;
    refresh_token?: string;
    cashier?: StationUser;
    station?: { id?: string; name?: string; stationCode?: string };
    assignment?: { stationId?: string; station?: { id?: string; name?: string; stationCode?: string } };
    stationAssignment?: { stationId?: string; station?: { id?: string; name?: string; stationCode?: string } };
  };
  cashier?: StationUser;
};

type BackendRefreshResponse = {
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    access_token?: string;
    refresh_token?: string;
  };
};

function pickAccessToken(response: BackendAuthResponse | BackendRefreshResponse) {
  return response.accessToken ?? response.access_token ?? response.data?.accessToken ?? response.data?.access_token;
}

function pickRefreshToken(response: BackendAuthResponse | BackendRefreshResponse) {
  return response.refreshToken ?? response.refresh_token ?? response.data?.refreshToken ?? response.data?.refresh_token;
}

function pickUser(response: BackendAuthResponse): StationUser | undefined {
  const user = response.user ?? response.cashier ?? response.data?.user ?? response.data?.cashier;

  if (!user) {
    return undefined;
  }

  const station = response.station ?? response.data?.station;
  const assignment =
    response.assignment ??
    response.stationAssignment ??
    response.data?.assignment ??
    response.data?.stationAssignment;
  const assignedStation = assignment?.station ?? station;
  const firstName = user.firstName;
  const lastName = user.lastName;

  return {
    ...user,
    name: user.name || [firstName, lastName].filter(Boolean).join(" ") || user.phone,
    firstName,
    lastName,
    stationId: user.stationId ?? assignment?.stationId ?? assignedStation?.id,
    stationName: user.stationName ?? assignedStation?.name,
    stationCode: user.stationCode ?? assignedStation?.stationCode
  };
}

export async function stationCashierLogin(
  payload: StationCashierLoginPayload
): Promise<AuthSession> {
  const { data } = await apiClient.post<BackendAuthResponse>(
    "/auth/station/cashier/login",
    payload
  );

  const accessToken = pickAccessToken(data);
  const refreshToken = pickRefreshToken(data);
  const user = pickUser(data);

  if (!accessToken || !refreshToken || !user) {
    throw new Error("Reponse auth invalide");
  }

  return {
    accessToken,
    refreshToken,
    user: {
      ...user,
      stationCode: user.stationCode ?? payload.stationCode
    }
  };
}

export async function refresh(refreshToken: string) {
  const { data } = await apiClient.post<BackendRefreshResponse>("/auth/refresh", {
    refreshToken
  });

  const nextAccessToken = pickAccessToken(data);
  const nextRefreshToken = pickRefreshToken(data) ?? refreshToken;

  if (!nextAccessToken) {
    throw new Error("Refresh token invalide");
  }

  return {
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken
  };
}

export async function me() {
  const { data } = await apiClient.get<StationUser | { user?: StationUser; data?: StationUser }>(
    "/auth/me"
  );

  if ("user" in data && data.user) {
    return data.user;
  }

  if ("data" in data && data.data) {
    return data.data;
  }

  const currentUser = data as StationUser;

  return {
    ...currentUser,
    name:
      currentUser.name ||
      [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ") ||
      currentUser.phone
  };
}
