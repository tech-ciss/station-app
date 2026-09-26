import { useCallback, useState } from "react";
import { useFocusEffect, router } from "expo-router";
import * as Haptics from "expo-haptics";

import { resolveDriverByQr } from "@/features/qr-scan/services/drivers.api";
import { parseDriverQr } from "@/features/qr-scan/services/qr-parser.service";
import { logQrEvent } from "@/features/qr-scan/services/qr-logger.service";
import { useTransactionStore } from "@/store/transaction.store";
import type { QrScanSource } from "@/features/qr-scan/types/qr-scan.types";

export function useQrScanner() {
  const setSelectedDriver = useTransactionStore((state) => state.setSelectedDriver);
  const [isScanningLocked, setIsScanningLocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setIsScanningLocked(false);
      setErrorMessage(null);

      return () => {
        setIsScanningLocked(true);
      };
    }, [])
  );

  const processRawValue = useCallback(
    async (rawValue: string, source: QrScanSource) => {
      if (isScanningLocked) {
        return false;
      }

      setIsScanningLocked(true);
      logQrEvent("qr_detected", { source });

      const parsedScan = parseDriverQr(rawValue, source);

      if (!parsedScan) {
        logQrEvent("qr_invalid", { source });
        setErrorMessage("QR non reconnu. Réessayez.");
        setIsScanningLocked(false);
        return false;
      }

      try {
        const driver = await resolveDriverByQr(parsedScan.driverIdentifier);
        setSelectedDriver(driver);
      } catch {
        logQrEvent("driver_resolve_failed", { source });
        setErrorMessage("Chauffeur introuvable ou QR expiré.");
        setIsScanningLocked(false);
        return false;
      }

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics is a UX enhancement; navigation must remain reliable without it.
      }

      logQrEvent("driver_navigation", { driverIdentifier: parsedScan.driverIdentifier });
      router.push("/(session)/driver-confirm");
      return true;
    },
    [isScanningLocked, setSelectedDriver]
  );

  return {
    errorMessage,
    isScanningLocked,
    processRawValue,
    clearScanError: () => setErrorMessage(null),
    resetScannerLock: () => setIsScanningLocked(false)
  };
}
