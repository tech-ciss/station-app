import { StyleSheet, Text, View } from "react-native";
import { CameraView, type BarcodeScanningResult } from "expo-camera";

import { ScannerFrame } from "@/features/qr-scan/components/ScannerFrame";

type CameraScannerProps = {
  enableTorch: boolean;
  isScanningLocked: boolean;
  scanLineTranslateY: Parameters<typeof ScannerFrame>[0]["scanLineTranslateY"];
  scannerSize: number;
  onQrCodeScanned: (rawValue: string) => void;
};

export function CameraScanner({
  enableTorch,
  isScanningLocked,
  scanLineTranslateY,
  scannerSize,
  onQrCodeScanned
}: CameraScannerProps) {
  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (result.type !== "qr" || isScanningLocked) {
      return;
    }

    onQrCodeScanned(result.data);
  }

  return (
    <View className="flex-1 overflow-hidden bg-black">
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={enableTorch}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarcodeScanned}
      />
      <View className="absolute inset-0 bg-black opacity-45" />
      <ScannerFrame
        size={scannerSize}
        scanLineTranslateY={scanLineTranslateY}
        isLocked={isScanningLocked}
      />
      <View className="absolute bottom-4 left-0 right-0 items-center">
        <Text className="rounded-full bg-black/60 px-4 py-2 text-caption font-semibold text-white">
          {isScanningLocked ? "Traitement du QR..." : "En attente d'un QR code"}
        </Text>
      </View>
    </View>
  );
}
