import type { ParsedQrResult, QrScanSource } from "@/features/qr-scan/types/qr-scan.types";

type DriverQrPayload = {
  driverId?: string;
};

function isDriverCode(value: string) {
  return /^(DRV|DRVQR)-[A-Z0-9-]{4,}$/i.test(value);
}

function parseJsonPayload(rawValue: string): DriverQrPayload | null {
  try {
    const parsed = JSON.parse(rawValue) as DriverQrPayload;

    if (parsed && typeof parsed.driverId === "string" && parsed.driverId.trim().length > 0) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

export function parseDriverQr(rawValue: string, source: QrScanSource): ParsedQrResult | null {
  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    return null;
  }

  const jsonPayload = parseJsonPayload(trimmedValue);

  if (jsonPayload?.driverId) {
    return {
      rawValue: trimmedValue,
      driverIdentifier: jsonPayload.driverId,
      source
    };
  }

  if (isDriverCode(trimmedValue)) {
    return {
      rawValue: trimmedValue,
      driverIdentifier: trimmedValue.toUpperCase(),
      source
    };
  }

  return null;
}
