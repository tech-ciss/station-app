import { useEffect, useState } from "react";
import { ScrollView, Text, View, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { Card, EmptyState, ScreenContainer, StatusBadge } from "@/components/ui";
import { resolveApiAssetUrl } from "@/services/api/client";
import { useSessionStore } from "@/store/session.store";
import { useTransactionStore } from "@/store/transaction.store";
import type { TransactionSyncStatus } from "@/types/transaction";
import { useAuthStore } from "@/store/auth.store";


// --- HELPERS (Idéalement à isoler dans un dossier /utils) ---
const formatAmount = (value: number) => `${value.toLocaleString("fr-FR")} FCFA`;
const formatLiters = (value: number) => `${value.toLocaleString("fr-FR")} L`;
const fuelLabel = (value: string) => value === "GASOIL" ? "Gasoil" : "Super";

const formatDateAndEncoding = (dateString: string) => {
  const dateObj = new Date(dateString);
  const date = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(dateObj);
  const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(dateObj);
  return { date, time };
};

const SYNC_MAPPING: Record<TransactionSyncStatus, { label: string; type: "warning" | "danger" | "success" }> = {
  PENDING: { label: "En attente", type: "warning" },
  LOCAL_PENDING: { label: "En attente", type: "warning" },
  SYNCING: { label: "En attente", type: "warning" },
  FAILED: { label: "Échec", type: "danger" },
  SYNCED: { label: "Synchronisée", type: "success" }, // Hypothèse sur la clé succès
};

// --- COMPOSANT SOUS-SECTION ---
function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-caption font-bold uppercase tracking-wider text-yely-muted">{title}</Text>
      <Card className="p-4 gap-3 border border-yely-border/40 bg-yely-surface">{children}</Card>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-0.5">
      <Text className="text-bodySmall text-yely-muted">{label}</Text>
      <Text className="text-bodySmall font-semibold text-yely-text">{value}</Text>
    </View>
  );
}

// --- ÉCRAN PRINCIPAL ---
export function TransactionDetailsScreen() {
  const user = useAuthStore((state) => state.user);
  const { transactionId } = useLocalSearchParams<{ transactionId?: string }>();
  const currentSession = useSessionStore((state) => state.currentSession);
  const transaction = useTransactionStore((state) =>
    state.transactions.find((item) => item.id === transactionId)
  );
  const [imageHasError, setImageHasError] = useState(false);

  const photoUri = resolveApiAssetUrl(transaction?.photo?.uri);

  useEffect(() => {
    setImageHasError(false);
  }, [photoUri]);

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

  if (!transaction) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Transaction introuvable"
          description="Ce détail de transaction n'est pas disponible."
        />
      </ScreenContainer>
    );
  }

  const { date, time } = formatDateAndEncoding(transaction.createdAt);
  const syncConfig = SYNC_MAPPING[transaction.syncStatus] || { label: "Inconnu", type: "warning" };
  const driverName = `${transaction.driver.firstName} ${transaction.driver.lastName}`;
  const fullName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Pompiste YELY";
  const photoSourceLabel = transaction.photo?.source === "gallery" ? "Galerie" : "Appareil";

  return (
    <ScreenContainer scroll={false} contentClassName="p-0">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-5 pb-8 pt-5"
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête */}
        <View className="flex-row items-center justify-between">
          <View className="gap-0.5">
            <Text className="text-headingMedium font-bold text-yely-text">Détail transaction</Text>
            <Text className="text-bodySmall text-yely-muted">Reçu numérique en lecture seule.</Text>
          </View>
          <StatusBadge label={syncConfig.label} type={syncConfig.type} />
        </View>

        {/* --- BLOC PRINCIPAL : LE REÇU --- */}
        <Card className="p-5 border-t-4 border-t-yely-primary gap-4 bg-yely-surface shadow-sm">
          <View className="items-center justify-center py-2 gap-1">
            <Text className="text-caption font-bold uppercase tracking-widest text-yely-muted">
              {fuelLabel(transaction.fuelType)}
            </Text>
            <Text className="text-headingLarge font-black text-yely-text text-center">
              {formatAmount(transaction.amount)}
            </Text>
            <Text className="text-body font-bold text-yely-primaryDark bg-yely-primaryLight px-3 py-1 rounded-full mt-1">
              {formatLiters(transaction.liters)}
            </Text>
          </View>

          <View className="h-px bg-dashed border-t border-dashed border-yely-border/80 my-1" />

          <View className="gap-2">
            <DetailRow label="Référence" value={transaction.reference} />
            <DetailRow label="Date & Heure" value={`${date} à ${time}`} />
          </View>
        </Card>

        {/* --- BLOC INTERVENANTS --- */}
        <InfoSection title="Acteurs & Emplacement">
          <DetailRow label="Chauffeur" value={driverName} />
          <DetailRow label="Téléphone" value={transaction.driver.phone} />
          <View className="h-px bg-yely-border/40 my-1" />
          <DetailRow label="Station" value={currentSession.stationName} />
          <DetailRow label="Pompe" value={currentSession.pumpName} />
          <DetailRow label="caissier" value={fullName} />
        </InfoSection>

        {/* --- BLOC PHOTO JUSTIFICATIVE --- */}
        <InfoSection title="Photo justificative">
          {photoUri && !imageHasError ? (
            <View className="relative h-44 w-full overflow-hidden rounded-xl border border-yely-border/60">
              <Image
                source={{ uri: photoUri }}
                resizeMode="cover"
                style={{ width: "100%", height: "100%", backgroundColor: "#F0F4F2" }}
                onError={() => setImageHasError(true)}
              />
              <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded">
                <Text className="text-[10px] font-medium text-white uppercase">
                  {photoSourceLabel}
                </Text>
              </View>
            </View>
          ) : (
            <View className="h-32 items-center justify-center rounded-xl bg-yely-surfaceMuted border border-dashed border-yely-border gap-1">
              <Text className="text-bodySmall font-bold text-yely-muted">Aucun visuel disponible</Text>
              <Text className="text-caption text-yely-muted/70">
                Source : {photoSourceLabel === "Appareil" ? "Appareil photo" : "Galerie"}
              </Text>
            </View>
          )}
        </InfoSection>

      </ScrollView>
    </ScreenContainer>
  );
}
