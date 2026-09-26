import { useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

import { Button, Input, ScreenContainer, Card, EmptyState, StepBar, StatusBadge } from "@/components/ui";
import { RuntimeBanner } from "@/components/station/RuntimeBanner";
import { PumpPhotoPicker } from "@/features/transactions/components/PumpPhotoPicker";
import {
  analyzePumpPhoto,
  isPumpPhotoAiEnabled
} from "@/features/transactions/services/pump-photo-ai.api";
import { useSingleFlight } from "@/hooks/use-single-flight";
import { useSessionStore } from "@/store/session.store";
import { useTransactionStore } from "@/store/transaction.store";
import type { FuelType, TransactionPhoto } from "@/types/transaction";
import { formatMoney, parseDecimalInput, parseMoneyInput } from "@/utils/format";

const fuelOptions: Array<{ label: string; value: FuelType; icon: string }> = [
  { label: "Super", value: "SUPER", icon: "💧" },
  { label: "Gasoil", value: "GASOIL", icon: "🛢️" },
];

function formatInputNumber(value: number) {
  const fixedValue = Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
  return fixedValue.replace(".", ",");
}

export function DriverConfirmScreen() {
  const currentSession = useSessionStore((state) => state.currentSession);
  const selectedDriver = useTransactionStore((state) => state.selectedDriver);
  const currentTransaction = useTransactionStore((state) => state.currentTransaction);
  const createTransaction = useTransactionStore((state) => state.createTransaction);
  const isCreatingTransaction = useTransactionStore((state) => state.isCreatingTransaction);
  const runCreateTransaction = useSingleFlight();
  const hasRequestedSuccessNavigation = useRef(false);

  const [fuelType, setFuelType] = useState<FuelType | null>(null);
  const [amount, setAmount] = useState("");
  const [liters, setLiters] = useState("");
  const [photo, setPhoto] = useState<TransactionPhoto | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedTransactionId, setCompletedTransactionId] = useState<string | null>(null);

  useEffect(() => {
    if (
      !completedTransactionId ||
      currentTransaction?.id !== completedTransactionId ||
      hasRequestedSuccessNavigation.current
    ) {
      return;
    }

    hasRequestedSuccessNavigation.current = true;
    router.replace("/(session)/success");
  }, [completedTransactionId, currentTransaction?.id]);

  const amountValue = parseMoneyInput(amount);
  const litersValue = parseDecimalInput(liters);

  const isFormValid =
    fuelType &&
    Number.isFinite(amountValue) &&
    amountValue > 0 &&
    Number.isFinite(litersValue) &&
    litersValue > 0 &&
    photo;

  if (!currentSession?.isActive) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Session indisponible"
          description="La session active est en cours de restauration."
        />
      </ScreenContainer>
    );
  }

  if (!selectedDriver) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Aucun chauffeur sélectionné"
          description="Revenez au scan pour identifier un chauffeur."
        />
      </ScreenContainer>
    );
  }

  async function handlePhotoChange(nextPhoto: TransactionPhoto | null) {
    setPhoto(nextPhoto);
    setAnalysisMessage(null);
    setAnalysisError(null);

    if (!nextPhoto) {
      return;
    }

    if (!isPumpPhotoAiEnabled()) {
      if (__DEV__) {
        setAnalysisMessage("IA photo non configurée. Ajoutez EXPO_PUBLIC_PUMP_PHOTO_AI_URL.");
      }
      return;
    }

    setIsAnalyzingPhoto(true);

    try {
      const analysisFuelType = fuelType ?? selectedDriver?.fuelType;

      if (!analysisFuelType) {
        setAnalysisError("Sélectionnez un carburant avant l'analyse IA.");
        return;
      }

      const analysis = await analyzePumpPhoto(nextPhoto.uri, {
        fuelType: analysisFuelType
      });
      let appliedFields = 0;

      if (analysis.amount && analysis.amount > 0) {
        setAmount(formatInputNumber(Math.round(analysis.amount)));
        appliedFields += 1;
      }

      if (analysis.liters && analysis.liters > 0) {
        setLiters(formatInputNumber(analysis.liters));
        appliedFields += 1;
      }

      if (analysis.fuelType) {
        setFuelType(analysis.fuelType);
        appliedFields += 1;
      }

      if (appliedFields > 0) {
        setAnalysisMessage("Champs préremplis par IA. Vérifiez avant validation.");
      } else {
        setAnalysisError("L'IA n'a pas reconnu les informations. Saisissez-les manuellement.");
      }
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "Analyse IA indisponible. Saisissez les champs manuellement."
      );
    } finally {
      setIsAnalyzingPhoto(false);
    }
  }

  async function handleValidateTransaction() {
    const driver = selectedDriver;
    const session = currentSession;

    if (
      !isFormValid ||
      isAnalyzingPhoto ||
      isCreatingTransaction ||
      !fuelType ||
      !photo ||
      !driver ||
      !session
    ) {
      return;
    }

    await runCreateTransaction(async () => {
      setSubmitError(null);
      setCompletedTransactionId(null);
      hasRequestedSuccessNavigation.current = false;

      try {
        const transaction = await createTransaction({
          driverId: driver.id,
          fuelType,
          amount: amountValue,
          liters: litersValue,
          photo,
          stationSessionId: session.id ?? session.openedAt,
          stationId: session.stationId,
          pumpId: session.pumpId,
        });

        setCompletedTransactionId(transaction.id);
      } catch (error) {
        setCompletedTransactionId(null);
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Transaction refusée. Réessayez."
        );
      }
    });
  }

  return (
    <ScreenContainer scroll={false} contentClassName="flex-1 p-4">
      <View className="flex-1">

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="mt-4">
          <RuntimeBanner  />
          </View>
          <View className="mt-4">
          <StepBar currentStep={3} totalSteps={4} />
          </View>

          {/* ✅ Chauffeur compact */}
          <Card className="mt-5 gap-4">
            <View className="flex-row items-center gap-4">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-yely-primaryLight">
                <Text className="text-headingSmall font-bold text-yely-primaryDark">
                  {selectedDriver.firstName[0]}
                  {selectedDriver.lastName[0]}
                </Text>
              </View>

              <View className="flex-1 gap-1">
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="flex-1 text-headingSmall font-bold text-yely-text">
                    {selectedDriver.firstName} {selectedDriver.lastName}
                  </Text>
                  <StatusBadge label="Vérifié" type="success" />
                </View>
                <Text className="text-bodySmall text-yely-muted">{selectedDriver.phone}</Text>
              </View>
            </View>
          </Card>

          {/* ✅ Carburant */}
          <View className="mt-5 gap-2">
            <Text className="font-semibold">Carburant</Text>
            <View className="flex-row gap-2">
              {fuelOptions.map((option) => {
                const selected = fuelType === option.value;

                return (
                  <Button
                    key={option.value}
                    title={`${option.icon} ${option.label}`}
                    variant={selected ? "primary" : "outline"}
                    className="flex-1"
                    onPress={() => setFuelType(option.value)}
                  />
                );
              })}
            </View>
          </View>

          {/* ✅ Inputs rapides */}
          <View className="mt-5 gap-2">
            <Text className="font-semibold">Montant & volume</Text>

            <View className="flex-row gap-2">
              <View className="flex-1 min-w-0">
                <Input
                  placeholder="Montant"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              <View className="flex-1 min-w-0">
                <Input
                  placeholder="Litres"
                  keyboardType="decimal-pad"
                  value={liters}
                  onChangeText={setLiters}
                />
              </View>
            </View>
          </View>

          {/* ✅ PHOTO (PRIORITÉ) */}
          <View className="mt-5 gap-2">
            <Text className="font-semibold">📸 Photo justificatif</Text>

            <PumpPhotoPicker photo={photo} onChange={handlePhotoChange} />

            {!photo && (
              <Text className="text-sm text-red-500">
                Photo obligatoire
              </Text>
            )}

            {isAnalyzingPhoto ? (
              <Text className="text-caption font-semibold text-yely-primaryDark">
                Analyse IA de la pompe en cours...
              </Text>
            ) : null}

            {analysisMessage ? (
              <Text className="text-caption font-semibold text-yely-primaryDark">
                {analysisMessage}
              </Text>
            ) : null}

            {analysisError ? (
              <Text className="text-caption font-semibold text-yely-warning">
                {analysisError}
              </Text>
            ) : null}
          </View>
        </ScrollView>

        {/* ✅ CTA sticky */}
        <View className="mt-2">
          <Button
            title={
              amountValue > 0
                ? `Valider — ${formatMoney(amountValue)}`
                : "Valider"
            }
            size="lg"
            loading={isCreatingTransaction}
            disabled={!isFormValid || isAnalyzingPhoto || isCreatingTransaction}
            onPress={handleValidateTransaction}
          />
          {submitError ? (
            <Text className="mt-2 text-center text-caption font-semibold text-yely-danger">
              {submitError}
            </Text>
          ) : null}
        </View>

      </View>
    </ScreenContainer>
  );
}
