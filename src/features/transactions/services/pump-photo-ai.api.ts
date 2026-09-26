import type { FuelType } from "@/types/transaction";

const PUMP_PHOTO_AI_URL = process.env.EXPO_PUBLIC_PUMP_PHOTO_AI_URL ?? "";
const PUMP_PHOTO_AI_KEY = process.env.EXPO_PUBLIC_PUMP_PHOTO_AI_KEY ?? "";
const PUMP_PHOTO_AI_FIELD = process.env.EXPO_PUBLIC_PUMP_PHOTO_AI_FIELD ?? "file";
const PUMP_PHOTO_AI_LAYOUT = process.env.EXPO_PUBLIC_PUMP_PHOTO_AI_LAYOUT ?? "auto";

type PumpPhotoAiResponse = Record<string, unknown>;

export type PumpPhotoAnalysisResult = {
  amount?: number;
  liters?: number;
  fuelType?: FuelType;
  confidence?: number;
  raw: unknown;
};

export type PumpPhotoAnalysisOptions = {
  fuelType: FuelType;
  fuelPrice?: number | null;
  terminalLayout?: string;
};

export function isPumpPhotoAiEnabled() {
  return PUMP_PHOTO_AI_URL.trim().length > 0;
}

function getFileName(uri: string) {
  return uri.split("/").pop() || `pump-photo-${Date.now()}.jpg`;
}

function getMimeType(fileName: string) {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";

  return "image/jpeg";
}

function asRecord(value: unknown): PumpPhotoAiResponse | null {
  return typeof value === "object" && value !== null ? (value as PumpPhotoAiResponse) : null;
}

function unwrapResponse(payload: unknown): PumpPhotoAiResponse {
  const root = asRecord(payload);

  if (!root) return {};

  const nested =
    asRecord(root.data) ??
    asRecord(root.result) ??
    asRecord(root.results) ??
    asRecord(root.prediction);

  return nested ?? root;
}

function parseNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\s+/g, "")
    .replace(/,/g, ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseFuelType(value: unknown): FuelType | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (["gasoil", "diesel", "diesel fuel"].some((item) => normalized.includes(item))) {
    return "GASOIL";
  }

  if (["super", "essence", "gasoline", "petrol"].some((item) => normalized.includes(item))) {
    return "SUPER";
  }

  return undefined;
}

function appFuelToAiFuel(fuelType: FuelType) {
  return fuelType === "GASOIL" ? "gasoil" : "super";
}

function pickValue(payload: PumpPhotoAiResponse, keys: string[]) {
  for (const key of keys) {
    if (payload[key] !== undefined && payload[key] !== null) {
      return payload[key];
    }
  }

  return undefined;
}

export function normalizePumpPhotoAnalysis(payload: unknown): PumpPhotoAnalysisResult {
  const data = unwrapResponse(payload);
  const amount = parseNumber(
    pickValue(data, ["amount", "montant", "total", "price", "prix", "amountFcfa"])
  );
  const liters = parseNumber(
    pickValue(data, ["liters", "litres", "liter", "litre", "volume", "quantity", "qty"])
  );
  const fuelType = parseFuelType(
    pickValue(data, [
      "detected_fuel_type",
      "fuelType",
      "fuel_type",
      "carburant",
      "product",
      "type",
      "fuel"
    ])
  );
  const confidence = parseNumber(
    pickValue(data, ["fuel_confidence", "confidence", "score", "probability"])
  );

  return {
    amount,
    liters,
    fuelType,
    confidence,
    raw: payload
  };
}

export async function analyzePumpPhoto(
  uri: string,
  options: PumpPhotoAnalysisOptions
): Promise<PumpPhotoAnalysisResult> {
  if (!isPumpPhotoAiEnabled()) {
    throw new Error("Analyse IA non configuree.");
  }

  const fileName = getFileName(uri);
  const formData = new FormData();

  formData.append(PUMP_PHOTO_AI_FIELD, {
    uri,
    name: fileName,
    type: getMimeType(fileName)
  } as unknown as Blob);
  formData.append("fuel_type", appFuelToAiFuel(options.fuelType));
  formData.append("terminal_layout", options.terminalLayout ?? PUMP_PHOTO_AI_LAYOUT);

  if (typeof options.fuelPrice === "number" && Number.isFinite(options.fuelPrice)) {
    formData.append("fuel_price", String(options.fuelPrice));
  }

  const response = await fetch(PUMP_PHOTO_AI_URL, {
    method: "POST",
    headers: {
      ...(PUMP_PHOTO_AI_KEY ? { Authorization: `Bearer ${PUMP_PHOTO_AI_KEY}` } : {})
    },
    body: formData
  });

  const payload = (await response.json().catch(() => ({}))) as unknown;

  if (!response.ok) {
    const message = unwrapResponse(payload).message;
    throw new Error(typeof message === "string" ? message : "Analyse IA echouee.");
  }

  const data = unwrapResponse(payload);

  if (data.success === false || data.status === "rejected") {
    throw new Error(
      typeof data.message === "string" ? data.message : "Analyse IA rejetee."
    );
  }

  return normalizePumpPhotoAnalysis(payload);
}
