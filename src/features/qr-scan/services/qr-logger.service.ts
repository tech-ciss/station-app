type QrLogEvent =
  | "permission_granted"
  | "qr_detected"
  | "qr_invalid"
  | "driver_resolve_failed"
  | "driver_navigation";

export function logQrEvent(event: QrLogEvent, payload?: Record<string, string>) {
  if (!__DEV__) {
    return;
  }

  console.log(`[qr-scan] ${event}`, payload ?? {});
}
