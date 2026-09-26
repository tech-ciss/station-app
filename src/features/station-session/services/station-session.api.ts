import { apiClient } from "@/services/api/client";
import { unwrapApiData, unwrapApiList } from "@/services/api/response";
import type { Pump, StationSession } from "@/types/session";
import type { StationUser } from "@/types/user";

type BackendPump = {
  id?: string;
  _id?: string;
  label?: string;
  name?: string;
  pumpCode?: string;
  code?: string;
  fuelType?: "GASOLINE" | "DIESEL" | string;
  isActive?: boolean;
  status?: string;
};

type BackendWorkSession = {
  id?: string;
  _id?: string;
  sessionId?: string;
  workSessionId?: string;
  work_session_id?: string;
  stationId?: string;
  station_id?: string;
  station?: { id?: string; _id?: string; name?: string; label?: string; stationCode?: string };
  pumpId?: string;
  pump_id?: string;
  pump?: { id?: string; _id?: string; label?: string; name?: string; pumpCode?: string; code?: string };
  cashierId?: string;
  cashier_id?: string;
  cashier?: { id?: string; _id?: string };
  openedAt?: string;
  opened_at?: string;
  startedAt?: string;
  started_at?: string;
  createdAt?: string;
  created_at?: string;
  isActive?: boolean;
  status?: string;
};

type BackendWorkSessionContainer = {
  session?: BackendWorkSession | null;
  workSession?: BackendWorkSession | null;
  work_session?: BackendWorkSession | null;
  currentWorkSession?: BackendWorkSession | null;
  current_work_session?: BackendWorkSession | null;
  result?: BackendWorkSession | null;
  mustSelectPump?: boolean;
  isStale?: boolean;
};

export type CurrentWorkSessionResponse = {
  session: StationSession | null;
  mustSelectPump: boolean;
  isStale?: boolean;
};

function backendFuelToApp(value?: string): Pump["fuelType"] | undefined {
  if (value === "DIESEL") {
    return "GASOIL";
  }

  if (value === "GASOLINE") {
    return "SUPER";
  }

  return undefined;
}

export function normalizePump(pump: BackendPump): Pump {
  const id = pump.id ?? pump._id ?? pump.pumpCode ?? pump.code ?? "unknown-pump";
  const isActive = pump.isActive ?? pump.status !== "INACTIVE";

  return {
    id,
    name: pump.label ?? pump.name ?? pump.pumpCode ?? `Pompe ${id}`,
    code: pump.pumpCode ?? pump.code,
    fuelType: backendFuelToApp(pump.fuelType),
    status: isActive ? "AVAILABLE" : "OCCUPIED",
    isActive
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function looksLikeWorkSession(value: unknown): value is BackendWorkSession {
  if (!isRecord(value)) {
    return false;
  }

  return [
    "id",
    "_id",
    "sessionId",
    "workSessionId",
    "work_session_id",
    "stationId",
    "station_id",
    "pumpId",
    "pump_id",
    "station",
    "pump",
    "cashier",
    "openedAt",
    "opened_at",
    "startedAt",
    "started_at",
    "status",
    "isActive"
  ].some((key) => key in value);
}

function pickWorkSession(raw: unknown): BackendWorkSession | null {
  if (!isRecord(raw)) {
    return null;
  }

  const container = raw as BackendWorkSessionContainer;
  const candidates = [
    container.session,
    container.workSession,
    container.work_session,
    container.currentWorkSession,
    container.current_work_session,
    container.result,
    raw as BackendWorkSession
  ];

  return candidates.find(looksLikeWorkSession) ?? null;
}

export function normalizeWorkSession(session: BackendWorkSession, user?: StationUser | null): StationSession {
  const id = session.id ?? session._id ?? session.sessionId ?? session.workSessionId ?? session.work_session_id;
  const stationId = session.stationId ?? session.station_id ?? session.station?.id ?? session.station?._id ?? user?.stationId ?? "station-unknown";
  const pumpId = session.pumpId ?? session.pump_id ?? session.pump?.id ?? session.pump?._id ?? "pump-unknown";
  const openedAt =
    session.openedAt ??
    session.opened_at ??
    session.startedAt ??
    session.started_at ??
    session.createdAt ??
    session.created_at ??
    new Date().toISOString();

  return {
    id,
    stationId,
    stationName: session.station?.name ?? session.station?.label ?? user?.stationName ?? "Station YELY",
    pumpId,
    pumpName: session.pump?.label ?? session.pump?.name ?? session.pump?.pumpCode ?? session.pump?.code ?? `Pompe ${pumpId}`,
    cashierId: session.cashierId ?? session.cashier_id ?? session.cashier?.id ?? session.cashier?._id ?? user?.id ?? "cashier",
    openedAt,
    isActive: session.isActive ?? (session.status ? session.status === "OPEN" : true)
  };
}

export async function fetchStationPumps(stationId: string) {
  const { data } = await apiClient.get(`/stations/me/${stationId}/pumps`, {
    params: { limit: 100 }
  });

  return unwrapApiList<BackendPump>(data).map(normalizePump);
}

export async function startWorkSession(payload: { stationId: string; pumpId: string }, user?: StationUser | null) {
  const { data } = await apiClient.post("/stations/me/work-sessions/start", payload);
  const raw = unwrapApiData<BackendWorkSession | BackendWorkSessionContainer>(data);
  const session = pickWorkSession(raw);

  return normalizeWorkSession((session ?? raw) as BackendWorkSession, user);
}

export async function fetchCurrentWorkSession(user?: StationUser | null): Promise<CurrentWorkSessionResponse> {
  const { data } = await apiClient.get("/stations/me/work-sessions/current");
  const raw = unwrapApiData<BackendWorkSessionContainer | BackendWorkSession | null>(data);
  const container = isRecord(raw) ? (raw as BackendWorkSessionContainer) : null;
  const session = pickWorkSession(raw);

  if (!session) {
    return {
      session: null,
      mustSelectPump: container?.mustSelectPump ?? true,
      isStale: container?.isStale
    };
  }

  return {
    session: normalizeWorkSession(session, user),
    mustSelectPump: container?.mustSelectPump ?? false,
    isStale: container?.isStale
  };
}

export async function closeWorkSession(sessionId: string) {
  await apiClient.post(`/stations/me/work-sessions/${encodeURIComponent(sessionId)}/close`);
}
