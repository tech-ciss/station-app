import type { QrScanSuccess, ParsedQrResult } from "@/features/qr-scan/types/qr-scan.types";
import { mockScannedDriver } from "@/features/qr-scan/mock-driver";

export function createMockDriverFromScan(scan: ParsedQrResult): QrScanSuccess {
  return {
    scan,
    driver: {
      ...mockScannedDriver,
      id: scan.driverIdentifier.startsWith("driver-") ? scan.driverIdentifier : mockScannedDriver.id
    }
  };
}
