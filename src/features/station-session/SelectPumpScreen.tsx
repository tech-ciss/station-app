import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  Button,
  Card,
  EmptyState,
  KpiCard,
  LoadingState,
  ScreenContainer,
  SectionHeader,
  StatusBadge,
  StepBar,
} from "@/components/ui";
import { fetchStationPumps } from "@/features/station-session/services/station-session.api";
import { useSingleFlight } from "@/hooks/use-single-flight";
import { toApiError } from "@/services/api/client";
import { useAuthStore } from "@/store/auth.store";
import { useSessionStore } from "@/store/session.store";
import type { Pump } from "@/types/session";

function isCashierAlreadyHasOpenSession(message: string) {
  return message.toLowerCase().includes("cashier already has an open work session");
}

function isPumpAlreadyHasOpenSession(message: string) {
  return message.toLowerCase().includes("pump already has an open work session");
}

function PumpCard({ pump, isSelected, onPress }: { pump: Pump; isSelected: boolean; onPress: () => void }) {
  const isOccupied = pump.status === "OCCUPIED";
  const fuelLabel = pump.fuelType === "GASOIL" ? "Gasoil" : pump.fuelType === "SUPER" ? "Super" : null;
  const fuelColor = pump.fuelType === "GASOIL" ? "#E65100" : pump.fuelType === "SUPER" ? "#0288D1" : "#6B7F79";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isOccupied, selected: isSelected }}
      disabled={isOccupied}
      onPress={onPress}
      className={isOccupied ? "opacity-50" : "opacity-100"}
    >
      <View
        className={`rounded-yely-lg border p-4 ${
          isSelected
            ? "border-yely-primary bg-yely-primaryLight"
            : isOccupied
            ? "border-yely-border bg-yely-surfaceSecondary"
            : "border-yely-border bg-white"
        }`}
        style={
          isSelected
            ? {
                shadowColor: "#0F9D58",
                shadowOpacity: 0.25,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              }
            : {
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }
        }
      >
        <View className="flex-row items-center gap-4">
          {/* Icône fuel */}
          <View
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: `${fuelColor}18` }}
          >
            <Ionicons name="water" size={22} color={fuelColor} />
          </View>

          {/* Infos */}
          <View className="flex-1 gap-1.5">
            <Text className="text-headingSmall font-bold text-yely-text">{pump.name}</Text>
            <View className="flex-row items-center gap-2">
              <StatusBadge
                label={isOccupied ? "Occupée" : "Libre"}
                type={isOccupied ? "warning" : "success"}
                dot
              />
              {fuelLabel ? (
                <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${fuelColor}18` }}>
                  <Text className="text-caption font-bold" style={{ color: fuelColor }}>
                    {fuelLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Indicateur sélection */}
          <View
            className={`h-7 w-7 items-center justify-center rounded-full border-2 ${
              isSelected
                ? "border-yely-primary bg-yely-primary"
                : "border-yely-border bg-white"
            }`}
          >
            {isSelected ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function SelectPumpScreen() {
  const user = useAuthStore((state) => state.user);
  const stationContext = useSessionStore((state) => state.stationContext);
  const selectedPump = useSessionStore((state) => state.selectedPump);
  const openSession = useSessionStore((state) => state.openSession);
  const isOpeningSession = useSessionStore((state) => state.isOpeningSession);
  const sessionError = useSessionStore((state) => state.sessionError);
  const selectPump = useSessionStore((state) => state.selectPump);
  const clearSelectedPump = useSessionStore((state) => state.clearSelectedPump);
  const restoreCurrentSession = useSessionStore((state) => state.restoreCurrentSession);
  const runOpenSession = useSingleFlight();
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [isLoadingPumps, setIsLoadingPumps] = useState(true);
  const [pumpError, setPumpError] = useState<string | null>(null);
  const stationId = user?.stationId ?? stationContext?.id;
  const stationName = user?.stationName ?? stationContext?.name;

  const loadPumps = useCallback(async () => {
    if (!stationId) {
      setIsLoadingPumps(false);
      setPumpError("Station introuvable pour ce caissier.");
      return;
    }
    setIsLoadingPumps(true);
    setPumpError(null);
    try {
      const nextPumps = await fetchStationPumps(stationId);
      setPumps(nextPumps);
    } catch (error) {
      setPumpError(toApiError(error).message);
    } finally {
      setIsLoadingPumps(false);
    }
  }, [stationId]);

  useEffect(() => {
    clearSelectedPump();
    void loadPumps();
  }, [clearSelectedPump, loadPumps]);

  const freePumps = pumps.filter((p) => p.status !== "OCCUPIED").length;

  async function handleOpenSession() {
    if (!selectedPump || !stationId || !user) return;

    await runOpenSession(async () => {
      try {
        await openSession({
          stationId,
          stationName,
          pumpId: selectedPump.id,
          pumpName: selectedPump.name,
          cashierId: user.id,
        });
      } catch (error) {
        const apiError = toApiError(error);

        if (apiError.status === 409 && isCashierAlreadyHasOpenSession(apiError.message)) {
          await restoreCurrentSession(user);
          return;
        }

        if (apiError.status === 409 && isPumpAlreadyHasOpenSession(apiError.message)) {
          await loadPumps();
          setPumpError("Cette pompe est déjà utilisée. Choisissez une autre pompe.");
        }
      }
    });
  }

  return (
    <ScreenContainer scroll={false} contentClassName="p-0">
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-5 px-5 pb-6 pt-5"
          showsVerticalScrollIndicator={false}
        >
          <SectionHeader
            title="Choisissez votre pompe"
            subtitle="Sélectionnez une pompe libre pour démarrer."
          />

          <StepBar currentStep={1} totalSteps={4} />

          {/* Résumé pompes disponibles */}
          {!isLoadingPumps && pumps.length > 0 ? (
            <View className="flex-row gap-3">
              <KpiCard
                label="Pompes libres"
                value={String(freePumps)}
                tone={freePumps > 0 ? "primary" : "danger"}
              />
              <KpiCard label="Total pompes" value={String(pumps.length)} />
            </View>
          ) : null}

          {isLoadingPumps ? (
            <LoadingState label="Chargement des pompes..." />
          ) : pumpError ? (
            <Card variant="danger" className="flex-row items-center gap-3">
              <Ionicons name="alert-circle" size={20} color="#D32F2F" />
              <Text className="flex-1 text-bodySmall font-semibold text-yely-danger">{pumpError}</Text>
            </Card>
          ) : pumps.length === 0 ? (
            <EmptyState
              title="Aucune pompe disponible"
              description="Contactez un responsable de station."
            />
          ) : (
            <View className="gap-3">
              {pumps.map((pump) => (
                <PumpCard
                  key={pump.id}
                  pump={pump}
                  isSelected={selectedPump?.id === pump.id}
                  onPress={() => selectPump(pump)}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Footer sticky */}
        <View
          className="border-t border-yely-border bg-white px-5 pb-5 pt-4"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: -4 },
            elevation: 8,
          }}
        >
          {selectedPump ? (
            <View className="mb-4 flex-row items-center gap-3 rounded-yely bg-yely-primaryLight px-4 py-3">
              <Ionicons name="water" size={18} color="#0A7A44" />
              <View className="flex-1">
                <Text className="text-caption font-bold uppercase text-yely-primaryDark">
                  Sélectionnée
                </Text>
                <Text className="text-body font-bold text-yely-primaryDark">
                  {selectedPump.name}
                </Text>
              </View>
            </View>
          ) : (
            <View className="mb-4 flex-row items-center gap-3 rounded-yely bg-yely-surfaceSecondary px-4 py-3">
              <Ionicons name="water-outline" size={18} color="#6B7F79" />
              <Text className="text-bodySmall text-yely-muted">Aucune pompe sélectionnée</Text>
            </View>
          )}

          <Button
            title="Ouvrir la session"
            size="lg"
            loading={isOpeningSession}
            disabled={!selectedPump || isOpeningSession || Boolean(pumpError)}
            onPress={handleOpenSession}
          />

          {sessionError ? (
            <Text className="mt-3 text-center text-caption font-semibold text-yely-danger">
              {sessionError}
            </Text>
          ) : null}

          {pumpError && !isLoadingPumps ? (
            <Button
              title="Actualiser les pompes"
              variant="secondary"
              className="mt-3"
              onPress={() => void loadPumps()}
            />
          ) : null}
        </View>
      </View>
    </ScreenContainer>
  );
}
