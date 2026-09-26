import { Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button, EmptyState, ScreenContainer, StepBar } from "@/components/ui";
import { useSessionStore } from "@/store/session.store";
import { useTransactionStore } from "@/store/transaction.store";
import { formatMoney, formatLiters } from "@/utils/format";

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4">
      <Text className="flex-1 text-bodySmall text-yely-muted">{label}</Text>
      <Text className="flex-1 text-right text-bodySmall font-bold text-yely-text">{value}</Text>
    </View>
  );
}

export function SuccessScreen() {
  const currentSession = useSessionStore((state) => state.currentSession);
  const currentTransaction = useTransactionStore((state) => state.currentTransaction);

  if (!currentSession?.isActive || !currentTransaction) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Transaction indisponible"
          description="Le récapitulatif de la transaction n'est pas disponible."
        />
      </ScreenContainer>
    );
  }

  const driverName = `${currentTransaction.driver.firstName} ${currentTransaction.driver.lastName}`;

  return (
    <ScreenContainer scroll={false} contentClassName="flex-1 px-5">

      <View className="flex-1">

        {/* ✅ HEADER */}
        <StepBar currentStep={4} totalSteps={4} className="mt-6" />

        {/* ✅ SUCCÈS VISUEL */}
        <View className="flex-1 items-center justify-center gap-4">

          <View className="items-center gap-3 py-2">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-yely-primaryLight">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-yely-primary">
                <Ionicons name="checkmark" size={40} color="#FFFFFF" />
              </View>
            </View>
            <View className="gap-1">
              <Text className="text-center text-headingMedium font-bold text-yely-text">
                Transaction enregistrée
              </Text>
              <Text className="text-center text-body text-yely-muted">
                La transaction a été enregistrée avec succès.
              </Text>
            </View>
          </View>

          {/* ✅ MINI RÉSUMÉ */}
          <View className="mt-4 items-center gap-3">
              <ReceiptRow label="Chauffeur" value={driverName} />
              <ReceiptRow label="Montant" value={formatMoney(currentTransaction.amount)} />
              <ReceiptRow label="Litres" value={formatLiters(currentTransaction.liters)} />
              <ReceiptRow label="Pompe" value={currentSession.pumpName} />
              <ReceiptRow label="Station" value={currentSession.stationName} />
          </View>

        </View>

        {/* ✅ ACTIONS */}
        <View className="pb-6 gap-3">

          <Button
            title="Scanner suivant"
            size="lg"
            onPress={() => router.replace("/(session)/scan")}
            leftIcon={<Ionicons name="qr-code-outline" size={20} color="#FFF" />}
          />

          <Button
            title="Voir dashboard"
            variant="ghost"
            onPress={() => router.replace("/(tabs)/service")}
          />

        </View>

      </View>
    </ScreenContainer>
  );
}
