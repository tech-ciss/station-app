import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Card, EmptyState, Input, ScreenContainer, StatusBadge } from "@/components/ui";
import { useSessionStore } from "@/store/session.store";
import { useTransactionStore } from "@/store/transaction.store";
import type { FuelType, MockTransaction, TransactionSyncStatus } from "@/types/transaction";

type FuelFilter = "ALL" | FuelType;

const FILTERS: Array<{ label: string; value: FuelFilter }> = [
  { label: "Tous", value: "ALL" },
  { label: "Super", value: "SUPER" },
  { label: "Gasoil", value: "GASOIL" },
];

const FUEL_CONFIG = {
  GASOIL: { label: "Gasoil", color: "#E65100", bg: "bg-orange-50 text-orange-700" },
  SUPER: { label: "Super", color: "#0288D1", bg: "bg-sky-50 text-sky-700" },
};

const SYNC_MAPPING: Record<TransactionSyncStatus, { label: string; type: "success" | "warning" | "danger" }> = {
  PENDING: { label: "En attente", type: "warning" },
  LOCAL_PENDING: { label: "En attente", type: "warning" },
  SYNCING: { label: "En cours", type: "warning" },
  FAILED: { label: "Échec", type: "danger" },
  SYNCED: { label: "Synchronisé", type: "success" },
};

// --- HELPERS (Idéalement externalisés) ---
const formatAmount = (value: number) => `${value.toLocaleString("fr-FR")} F`;
const formatLiters = (value: number) => `${value.toLocaleString("fr-FR")} L`;
const formatDateTime = (value: string) => {
  const d = new Date(value);
  return `${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
};

// --- COMPOSANT TRANSACTION COMPACT ---
function TransactionRow({ transaction }: { transaction: MockTransaction }) {
  const driverName = `${transaction.driver.firstName} ${transaction.driver.lastName}`;
  const sync = SYNC_MAPPING[transaction.syncStatus] || { label: "Inconnu", type: "warning" };
  const fuel = FUEL_CONFIG[transaction.fuelType];

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/transaction-details", params: { transactionId: transaction.id } })}
      className="active:opacity-70"
    >
      <Card className="flex-row items-center justify-between p-4 border border-yely-border/40 bg-yely-surface">
        <View className="flex-1 gap-1 pr-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-body font-bold text-yely-text">{driverName}</Text>
            <View className={`rounded px-1.5 py-0.5 ${fuel.bg}`}>
              <Text className="text-[10px] font-bold uppercase">{fuel.label}</Text>
            </View>
          </View>
          
          <Text className="text-caption text-yely-mutedLight">
            {transaction.reference} • {formatDateTime(transaction.createdAt)}
          </Text>
        </View>

        <View className="items-end gap-1.5">
          <Text className="text-body font-bold text-yely-text">
            {formatAmount(transaction.amount)}
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-caption font-semibold text-yely-muted">{formatLiters(transaction.liters)}</Text>
            <StatusBadge label={sync.label} type={sync.type} dot />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

// --- ÉCRAN PRINCIPAL ---
export function HistoryScreen() {
  const currentSession = useSessionStore((state) => state.currentSession);
  const transactions = useTransactionStore((state) => state.transactions);
  const loadRemoteTransactions = useTransactionStore((state) => state.loadRemoteTransactions);
  
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FuelFilter>("ALL");

  useEffect(() => {
    if (currentSession?.isActive) {
      void loadRemoteTransactions().catch(() => {});
    }
  }, [currentSession?.isActive, loadRemoteTransactions]);

  // Filtrage combiné optimisé
  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchesFuel = activeFilter === "ALL" || t.fuelType === activeFilter;
      if (!matchesFuel) return false;
      
      if (query.length === 0) return true;
      const fullName = `${t.driver.firstName} ${t.driver.lastName}`.toLowerCase();
      return (
        t.reference.toLowerCase().includes(query) ||
        fullName.includes(query) ||
        t.driver.phone.includes(query)
      );
    });
  }, [activeFilter, search, transactions]);

  // Métriques de la liste affichée
  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => {
        acc.amount += t.amount;
        acc.liters += t.liters;
        return acc;
      },
      { amount: 0, liters: 0 }
    );
  }, [filteredTransactions]);

  // Statuts de synchronisation globaux de la session
  const globalSync = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        if (t.syncStatus === "FAILED") acc.failed++;
        else if (t.syncStatus === "SYNCED") acc.synced++;
        else acc.pending++;
        return acc;
      },
      { synced: 0, pending: 0, failed: 0 }
    );
  }, [transactions]);

  return (
    <ScreenContainer scroll={false} contentClassName="p-0 bg-yely-surfaceMuted">
      
      {/* SECTION FIXE : RECHERCHE, FILTRES & STATS */}
      <View className="bg-white border-b border-yely-border px-5 pt-5 pb-4 gap-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-headingMedium font-bold text-yely-text">Historique</Text>
            <Text className="text-caption text-yely-muted">Transactions de votre session active</Text>
          </View>
          {/* Indicateur de synchro global discret */}
          <View className="flex-row gap-1.5 items-center bg-yely-surface p-1.5 rounded-lg border border-yely-border/40">
            {globalSync.pending > 0 && <View className="h-2 w-2 rounded-full bg-yely-warning animate-pulse" />}
            <Text className="text-[11px] font-semibold text-yely-text">
              {globalSync.synced}/{transactions.length} synchros
            </Text>
          </View>
        </View>

        <Input
          placeholder="Référence, chauffeur, numéro..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          leftSlot={<Ionicons name="search-outline" size={16} color="#A0B0AA" />}
          rightSlot={
            search.length > 0 ? (
              <Pressable onPress={() => setSearch("")} className="p-1">
                <Ionicons name="close-circle" size={16} color="#A0B0AA" />
              </Pressable>
            ) : null
          }
        />

        {/* Filtres à pilules horizontaux */}
        <View className="flex-row gap-2">
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.value;
            return (
              <Pressable
                key={f.value}
                onPress={() => setActiveFilter(f.value)}
                className={`rounded-full px-4 py-1.5 border ${
                  isActive ? "bg-yely-primaryDeep border-yely-primaryDeep" : "bg-white border-yely-border"
                }`}
              >
                <Text className={`text-caption font-bold ${isActive ? "text-white" : "text-yely-muted"}`}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Bandeau de résumé financier condensé */}
        <View className="flex-row bg-yely-surfaceMuted rounded-xl p-3 items-center justify-between divide-x divide-yely-border border border-yely-border/40">
          <View className="flex-1 items-center">
            <Text className="text-[10px] uppercase font-bold text-yely-mutedLight tracking-wider">Volume Total</Text>
            <Text className="text-body font-bold text-yely-text">{formatLiters(totals.liters)}</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-[10px] uppercase font-bold text-yely-mutedLight tracking-wider">Valeur Total</Text>
            <Text className="text-body font-bold text-yely-primaryDeep">{formatAmount(totals.amount)}</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-[10px] uppercase font-bold text-yely-mutedLight tracking-wider">Lignes</Text>
            <Text className="text-body font-bold text-yely-text">{filteredTransactions.length}</Text>
          </View>
        </View>
      </View>

      {/* LISTE DES TRANSACTIONS DÉFILANTE */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionRow transaction={item} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-2.5 px-5 pt-4 pb-8"
        ListEmptyComponent={
          <View className="pt-12">
            <EmptyState
              title={search || activeFilter !== "ALL" ? "Aucun résultat" : "Aucune transaction"}
              description="Modifiez vos critères ou attendez la validation d'un nouveau plein."
            />
          </View>
        }
      />
    </ScreenContainer>
  );
}
