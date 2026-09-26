import { useEffect, useState } from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { useCameraPermissions } from "expo-camera";

import { Button, Card, Input, ScreenContainer, StepBar } from "@/components/ui";
import { RuntimeBanner } from "@/components/station/RuntimeBanner";
import { CameraScanner } from "@/features/qr-scan/components/CameraScanner";
import { PermissionDeniedState } from "@/features/qr-scan/components/PermissionDeniedState";
import { useQrScanner } from "@/features/qr-scan/hooks/use-qr-scanner";
import { useScanLineAnimation } from "@/features/qr-scan/hooks/use-scan-line-animation";
import { logQrEvent } from "@/features/qr-scan/services/qr-logger.service";
import { useSingleFlight } from "@/hooks/use-single-flight";
import { toApiError } from "@/services/api/client";
import { useSessionStore } from "@/store/session.store";

const scannerSize = 260;
const scanTravel = scannerSize - 42;

export function ScanScreen() {
  const closeSession = useSessionStore((state) => state.closeSession);
  const runChangePump = useSingleFlight();
  const [permission, requestPermission] = useCameraPermissions();
  const scanLineTranslateY = useScanLineAnimation(scanTravel);
  const { errorMessage, isScanningLocked, processRawValue, clearScanError, resetScannerLock } =
    useQrScanner();
  const [isManualFormVisible, setIsManualFormVisible] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [isTorchEnabled, setIsTorchEnabled] = useState(false);
  const [galleryMessage, setGalleryMessage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isChangingPump, setIsChangingPump] = useState(false);
  const [changePumpError, setChangePumpError] = useState<string | null>(null);

  useEffect(() => {
    if (permission?.granted) {
      logQrEvent("permission_granted");
    }
  }, [permission?.granted]);

  function handleManualSubmit() {
    if (!manualCode.trim()) {
      return;
    }

    void processRawValue(manualCode, "MANUAL");
  }

  async function handleChangePump() {
    await runChangePump(async () => {
      setIsCameraActive(false);
      setChangePumpError(null);
      setIsChangingPump(true);

      try {
        await closeSession();
      } catch (error) {
        setChangePumpError(toApiError(error).message);
        setIsChangingPump(false);
      }
    });
  }

  async function handleStartScan() {
    clearScanError();
    setGalleryMessage(null);

    if (!permission?.granted) {
      const nextPermission = await requestPermission();

      if (!nextPermission.granted) {
        return;
      }
    }

    resetScannerLock();
    setIsTorchEnabled(false);
    setIsCameraActive(true);
  }
  async function handleScan(rawValue: string) {
  if (isScanningLocked) return;
  const didNavigate = await processRawValue(rawValue, "QR");

  if (didNavigate) {
    closeScanner();
  }
}

function closeScanner() {
  setIsCameraActive(false);
  setIsTorchEnabled(false);
  resetScannerLock();
}

  function handleCloseScanner() {
    setIsCameraActive(false);
    setIsTorchEnabled(false);
    resetScannerLock();
  }

return (
    <ScreenContainer scroll={false} contentClassName="flex-1 p-4">
      
      <RuntimeBanner />
      <StepBar currentStep={2} totalSteps={4} />

      {/* HEADER */}
      <View className="mt-3 mb-2">
        <Text className="text-lg font-bold">
          Scanner QR chauffeur
        </Text>
        <Text className="text-sm text-muted">
          Cadrez le code présenté
        </Text>
      </View>

      {/* SCANNER ZONE */}
      <View className="flex-1 mt-3">
        {!isCameraActive ? (
          <Button
            title="Scanner QR chauffeur"
            className="h-40 rounded-xl"
            onPress={handleStartScan}
          />
        ) : (
          <CameraScanner
            enableTorch={isTorchEnabled}
            isScanningLocked={isScanningLocked}
            scanLineTranslateY={scanLineTranslateY}
            scannerSize={scannerSize}
            onQrCodeScanned={handleScan}
          />
        )}
      </View>

      {/* ERROR */}
      {errorMessage && (
        <Text className="text-red-500 text-sm text-center mt-2">
          {errorMessage}
        </Text>
      )}

      {changePumpError && (
        <Text className="text-red-500 text-sm text-center mt-2">
          {changePumpError}
        </Text>
      )}

      {/* ACTIONS */}
      <View className="mt-4 gap-2">
        <Button
          title="Saisie manuelle"
          variant="secondary"
          onPress={() => setIsManualFormVisible(v => !v)}
        />

        <Button
          title="Changer de pompe"
          variant="outline"
          loading={isChangingPump}
          disabled={isChangingPump}
          onPress={handleChangePump}
        />
      </View>

      {/* MANUAL INPUT */}
      {isManualFormVisible && (
        <View className="mt-3 gap-2">
          <Input
            placeholder="DRV-123456"
            value={manualCode}
            onChangeText={setManualCode}
          />
          <Button
            title="Valider"
            disabled={!manualCode.trim()}
            onPress={handleManualSubmit}
          />
        </View>
      )}
    </ScreenContainer>
  );
}
