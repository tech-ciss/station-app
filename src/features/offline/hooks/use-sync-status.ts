import { useEffect, useMemo } from "react";

import {
  initializeOfflineAutoSync,
  updateSyncStats
} from "@/features/offline/services/offline-sync.service";
import { useSyncStore } from "@/store/sync.store";
import { useTransactionStore } from "@/store/transaction.store";
import { TransactionSyncStatus } from "@/types/transaction";

export function useSyncStatus() {
  const transactions = useTransactionStore((state) => state.transactions);
  const isSyncing = useSyncStore((state) => state.isSyncing);
  const lastSyncAt = useSyncStore((state) => state.lastSyncAt);

  const derivedStats = useMemo(
    () => ({
      pendingCount: transactions.filter(
        (transaction) =>
          transaction.syncStatus === TransactionSyncStatus.LOCAL_PENDING ||
          transaction.syncStatus === TransactionSyncStatus.PENDING ||
          transaction.syncStatus === TransactionSyncStatus.SYNCING
      ).length,
      failedCount: transactions.filter(
        (transaction) => transaction.syncStatus === TransactionSyncStatus.FAILED
      ).length,
      syncedCount: transactions.filter(
        (transaction) => transaction.syncStatus === TransactionSyncStatus.SYNCED
      ).length
    }),
    [transactions]
  );

  useEffect(() => {
    initializeOfflineAutoSync();
    updateSyncStats();
  }, []);

  useEffect(() => {
    useSyncStore.getState().updateStats(derivedStats);
  }, [derivedStats]);

  return {
    isSyncing,
    lastSyncAt,
    ...derivedStats
  };
}
