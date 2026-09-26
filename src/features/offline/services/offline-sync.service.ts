import { networkService } from "@/features/offline/services/network.service";
import { createTransaction as createBackendTransaction } from "@/features/transactions/services/transactions.api";
import { useSyncStore } from "@/store/sync.store";
import { useTransactionStore } from "@/store/transaction.store";
import { TransactionSyncStatus } from "@/types/transaction";
import type { MockTransaction } from "@/types/transaction";

export const MAX_RETRY = 5;

function canRetry(transaction: MockTransaction) {
  return transaction.retryCount < MAX_RETRY;
}

function isPending(transaction: MockTransaction) {
  return (
    transaction.syncStatus === TransactionSyncStatus.LOCAL_PENDING ||
    transaction.syncStatus === TransactionSyncStatus.PENDING
  );
}

function getQueue(includeFailed: boolean) {
  const transactions = useTransactionStore.getState().transactions;

  return transactions.filter((transaction) => {
    if (isPending(transaction)) {
      return true;
    }

    return includeFailed && transaction.syncStatus === TransactionSyncStatus.FAILED && canRetry(transaction);
  });
}

export function updateSyncStats() {
  const transactions = useTransactionStore.getState().transactions;

  useSyncStore.getState().updateStats({
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
  });
}

async function syncQueue(includeFailed: boolean) {
  const isOnline = await networkService.isOnline();

  if (!isOnline || useSyncStore.getState().isSyncing) {
    updateSyncStats();
    return;
  }

  const queue = getQueue(includeFailed);

  if (queue.length === 0) {
    updateSyncStats();
    return;
  }

  useSyncStore.getState().startSync();

  try {
    for (const transaction of queue) {
      if (!canRetry(transaction)) {
        continue;
      }

      const attemptAt = new Date().toISOString();

      useTransactionStore.getState().updateTransactionSyncStatus(
        transaction.id,
        TransactionSyncStatus.SYNCING,
        {
          incrementRetry: true,
          lastSyncAttempt: attemptAt
        }
      );

      try {
        const syncedTransaction = await createBackendTransaction({
          driverId: transaction.driverId,
          fuelType: transaction.fuelType,
          amount: transaction.amount,
          liters: transaction.liters,
          photo: transaction.photo,
          stationSessionId: transaction.stationSessionId,
          stationId: transaction.stationId,
          pumpId: transaction.pumpId,
          driver: transaction.driver
        });
        useTransactionStore.getState().updateTransaction(transaction.id, {
          remoteId: syncedTransaction.remoteId ?? syncedTransaction.id,
          reference: syncedTransaction.reference,
          syncStatus: TransactionSyncStatus.SYNCED,
          lastSyncAttempt: new Date().toISOString()
        });
      } catch {
        useTransactionStore
          .getState()
          .updateTransactionSyncStatus(transaction.id, TransactionSyncStatus.FAILED, {
            lastSyncAttempt: new Date().toISOString()
          });
      }
    }
  } finally {
    useSyncStore.getState().stopSync();
    updateSyncStats();
  }
}

export async function startSync() {
  await syncQueue(false);
}

export async function retryFailedTransactions() {
  await syncQueue(true);
}

let autoSyncInitialized = false;

export function initializeOfflineAutoSync() {
  if (autoSyncInitialized) {
    return;
  }

  autoSyncInitialized = true;
  networkService.subscribe((isOnline) => {
    if (isOnline) {
      void startSync();
    }
  });
}
