import type { MockDriver } from "@/types/driver";

export type QrScanSource = "QR" | "MANUAL";

export type ParsedQrResult = {
  rawValue: string;
  driverIdentifier: string;
  source: QrScanSource;
};

export type QrScanError = {
  message: string;
};

export type QrScanSuccess = {
  scan: ParsedQrResult;
  driver: MockDriver;
};
