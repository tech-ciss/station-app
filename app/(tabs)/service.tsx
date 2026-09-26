import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  Button,
  Card,
  EmptyState,
  ScreenContainer,
  StatusBadge,
  SyncStatusCard,
} from "@/components/ui";
import { getSessionTransactions } from "@/features/station-session/services/session-transactions";
import { useAuthStore } from "@/store/auth.store";
import { useSessionStore } from "@/store/session.store";
import { useTransactionStore } from "@/store/transaction.store";
import { formatLiters as formatLitersValue, formatMoney } from "@/utils/format";

// --- HELPERS ---
function formatDuration(openedAt: string) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(openedAt).getTime()) / 1000));
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

// --- COMPOSANT COMPACT : TRANSACTION TIMELINE ROW ---
function TransactionTimelineRow({ transaction, isLast }: { transaction: any; isLast: boolean }) {
  const driverName = `${transaction.driver.firstName} ${transaction.driver.lastName}`;

  return (
    <Pressable 
      onPress={() => router.push({ pathname: "/transaction-details", params: { transactionId: transaction.id } })}
      className="flex-row items-start gap-3 active:opacity-70"
    >
      {/* Design de la ligne temporelle (Timeline) */}
      <View className="items-center h-full">
        <View className="h-2.5 w-2.5 rounded-full bg-yely-primary border-2 border-white shadow-sm z-10 my-1" />
        {!isLast && <View className="w-0.5 flex-1 bg-yely-border/60 -mb-4 mt-1" />}
      </View>

      {/* Contenu principal */}
      <View className="flex-1 flex-row items-center justify-between pb-3.5 border-b border-yely-border/30">
        <View className="gap-0.5">
          <Text className="text-bodySmall font-bold text-yely-text">{driverName}</Text>
          <Text className="text-caption text-yely-mutedLight">Ref: {transaction.reference}</Text>
        </View>
        
        <View className="items-end gap-0.5">
          <Text className="text-bodySmall font-black text-yely-primaryDeep">
            {formatMoney(transaction.amount)}
          </Text>
          <Text className="text-[11px] font-medium text-yely-muted">
            {formatTime(transaction.createdAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// --- ÉCRAN PRINCIPAL ---
export default function ServiceRoute() {
  const currentSession = useSessionStore((state) => state.currentSession);
  const user = useAuthStore((state) => state.user);
  const transactions = useTransactionStore((state) => state.transactions);
  const loadRemoteTransactions = useTransactionStore((state) => state.loadRemoteTransactions);
  const [duration, setDuration] = useState("00:00:00");

  useEffect(() => {
    if (!currentSession?.openedAt) return;
    setDuration(formatDuration(currentSession.openedAt));
    const id = setInterval(() => setDuration(formatDuration(currentSession.openedAt)), 1000);
    return () => clearInterval(id);
  }, [currentSession?.openedAt]);

  useEffect(() => {
    if (currentSession?.isActive) {
      void loadRemoteTransactions().catch(() => {});
    }
  }, [currentSession?.isActive, loadRemoteTransactions]);

  const sessionTransactions = useMemo(() => {
    if (!currentSession) return [];
    return getSessionTransactions(transactions, currentSession);
  }, [currentSession, transactions]);

  const stats = useMemo(
    () =>
      sessionTransactions.reduce(
        (acc, t) => ({ count: acc.count + 1, amount: acc.amount + t.amount, liters: acc.liters + t.liters }),
        { count: 0, amount: 0, liters: 0 }
      ),
    [sessionTransactions]
  );

  const recentTransactions = sessionTransactions.slice(0, 5);

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

  return (
    <ScreenContainer scroll={false} contentClassName="p-0 bg-yely-surfaceMuted">
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-8"
          showsVerticalScrollIndicator={false}
        >
          {/* ── HERO BANNER REPENSI ── */}
          <View className="bg-[#0A3D2B] px-5 pt-6 pb-5 gap-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Ionicons name="water" size={18} color="#FFD700" />
                <Text className="text-headingSmall font-black text-white tracking-wide">
                  {currentSession.pumpName}
                </Text>
              </View>
              {/* Chronomètre déporté et discret */}
              <View className="flex-row items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full border border-white/10">
                <Ionicons name="time-outline" size={14} color="#FFD700" style={{ fontVariant: ["tabular-nums"] }} />
                <Text className="text-caption font-bold text-white tracking-widest">{duration}</Text>
              </View>
            </View>

            {/* Informations de l'environnement */}
            <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 border-t border-white/10">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="business-outline" size={13} color="rgba(255,255,255,0.5)" />
                <Text className="text-caption text-white/70">{currentSession.stationName}</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="person-outline" size={13} color="rgba(255,255,255,0.5)" />
                <Text className="text-caption text-white/70">{user?.name ?? currentSession.cashierId}</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="log-in-outline" size={13} color="rgba(255,255,255,0.5)" />
                <Text className="text-caption text-white/70">Ouvert à {formatTime(currentSession.openedAt)}</Text>
              </View>
            </View>
          </View>

          {/* ── CONTENU DE L'ÉCRAN ── */}
          <View className="gap-5 px-5 pt-5">
            
            {/* ── RUBAN DE RENDEMENT DE LA SESSION ── */}
            <View className="gap-2">
              <Text className="text-caption font-bold uppercase tracking-wider text-yely-muted">
                Activité de la session
              </Text>
              <Card className="flex-row p-4 justify-between items-center bg-white border border-yely-border/40 divide-x divide-yely-border">
                <View className="flex-1 items-center">
                  <Text className="text-[10px] uppercase font-bold text-yely-mutedLight tracking-wider">Volume</Text>
                  <Text className="text-body font-black text-yely-text">{formatLitersValue(stats.liters)}</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-[10px] uppercase font-bold text-yely-mutedLight tracking-wider">Valeur Total</Text>
                  <Text className="text-body font-black text-yely-primaryDeep">{formatMoney(stats.amount)}</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-[10px] uppercase font-bold text-yely-mutedLight tracking-wider">Tickets</Text>
                  <Text className="text-body font-black text-yely-text">{stats.count}</Text>
                </View>
              </Card>
            </View>

            {/* Statuts réseau / Synchro */}
            <SyncStatusCard />

            {/* ── FLUX DES DERNIÈRES TRANSACTIONS ── */}
            <View className="gap-3 mt-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-headingSmall font-bold text-yely-text">
                  Derniers passages
                </Text>
                {recentTransactions.length > 0 && (
                  <Pressable onPress={() => router.push("/(tabs)/history")}>
                    <Text className="text-caption font-bold text-yely-primaryDeep">
                      Voir les {sessionTransactions.length}
                    </Text>
                  </Pressable>
                )}
              </View>

              {recentTransactions.length > 0 ? (
                <Card className="p-4 bg-white border border-yely-border/40 gap-3">
                  {recentTransactions.map((transaction, index) => (
                    <TransactionTimelineRow
                      key={`${transaction.id}-${transaction.createdAt}`}
                      transaction={transaction}
                      isLast={index === recentTransactions.length - 1}
                    />
                  ))}
                </Card>
              ) : (
                <EmptyState
                  title="Aucun plein enregistré"
                  description="Les transactions validées sur cette pompe s'afficheront ici en temps réel."
                />
              )}
            </View>

          </View>
        </ScrollView>

        {/* ── FOOTER D'ACTION FIXE ── */}
        <View
          className="border-t border-yely-border bg-white px-5 pb-6 pt-4"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: -3 },
            elevation: 4,
          }}
        >
          <Button
            title="Clôturer la session"
            variant="danger"
            size="lg"
            className="rounded-xl"
            onPress={() => router.push("/close-session")}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
