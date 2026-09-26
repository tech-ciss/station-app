import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  createTransaction as createBackendTransaction,
  fetchMyTransactions
} from "@/features/transactions/services/transactions.api";
import { toApiError } from "@/services/api/client";
import { zustandStorage } from "@/services/storage/mmkv";
import type { MockDriver } from "@/types/driver";
import type {
  FuelType,
  MockTransaction,
  TransactionPayload,
  TransactionSyncStatus
} from "@/types/transaction";
import { TransactionSyncStatus as SyncStatus } from "@/types/transaction";

type TransactionState = {
  selectedDriver: MockDriver | null;
  currentTransaction: MockTransaction | null;
  transactions: MockTransaction[];
  isCreatingTransaction: boolean;
  transactionError: string | null;
  setSelectedDriver: (driver: MockDriver) => void;
  clearSelectedDriver: () => void;
  addTransaction: (transaction: MockTransaction) => void;
  loadRemoteTransactions: () => Promise<void>;
  getRecentTransactions: () => MockTransaction[];
  getTransactionById: (transactionId: string) => MockTransaction | undefined;
  getPendingTransactions: () => MockTransaction[];
  getFailedTransactions: () => MockTransaction[];
  updateTransaction: (transactionId: string, patch: Partial<MockTransaction>) => void;
  updateTransactionSyncStatus: (
    transactionId: string,
    syncStatus: TransactionSyncStatus,
    options?: { incrementRetry?: boolean; lastSyncAttempt?: string }
  ) => void;
  createTransaction: (
    payload: TransactionPayload & {
      stationId: string;
      pumpId: string;
    }
  ) => Promise<MockTransaction>;
  clearTransactionError: () => void;
};

function createLocalTransaction(
  payload: TransactionPayload & {
    stationId: string;
    pumpId: string;
  },
  driver: MockDriver,
  transactionNumber: number,
  syncStatus: TransactionSyncStatus = SyncStatus.LOCAL_PENDING
): MockTransaction {
  return {
    ...payload,
    id: `TRX-${String(transactionNumber).padStart(3, "0")}`,
    reference: `YELY-${new Date().getFullYear()}-${String(transactionNumber).padStart(4, "0")}`,
    driver,
    driverQrCodeToken: driver.qrCodeToken ?? undefined,
    syncStatus,
    retryCount: 0,
    lastSyncAttempt: syncStatus === SyncStatus.SYNCED ? new Date().toISOString() : null,
    createdAt: new Date().toISOString()
  };
}

function normalizeTransaction(transaction: MockTransaction): MockTransaction {
  const syncStatus =
    transaction.syncStatus === SyncStatus.PENDING ? SyncStatus.LOCAL_PENDING : transaction.syncStatus;

  return {
    ...transaction,
    syncStatus,
    retryCount: transaction.retryCount ?? 0,
    lastSyncAttempt: transaction.lastSyncAttempt ?? null
  };
}

function isPendingStatus(syncStatus: MockTransaction["syncStatus"]) {
  return syncStatus === SyncStatus.LOCAL_PENDING || syncStatus === SyncStatus.PENDING;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get): TransactionState => ({
      selectedDriver: null,
      currentTransaction: null,
      transactions: [],
      isCreatingTransaction: false,
      transactionError: null,
      setSelectedDriver: (driver) => {
        set({ selectedDriver: driver });
      },
      clearSelectedDriver: () => {
        set({ selectedDriver: null });
      },
      addTransaction: (transaction) => {
        const normalizedTransaction = normalizeTransaction(transaction);

        set((state) => ({
          transactions: [normalizedTransaction, ...state.transactions],
          currentTransaction: normalizedTransaction
        }));
      },
      loadRemoteTransactions: async () => {
        const remoteTransactions = await fetchMyTransactions();

        set((state) => {
          const localTransactions = state.transactions;
          const seenIds = new Set(
            localTransactions.flatMap((transaction) =>
              [transaction.id, transaction.remoteId].filter(Boolean)
            )
          );
          const mergedRemote = remoteTransactions.filter(
            (transaction) => !seenIds.has(transaction.id) && !seenIds.has(transaction.remoteId)
          );

          return {
            transactions: [...localTransactions, ...mergedRemote].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          };
        });
      },
      getRecentTransactions: () => {
        return get().transactions.slice(0, 10);
      },
      getTransactionById: (transactionId) => {
        return get().transactions.find((transaction) => transaction.id === transactionId);
      },
      getPendingTransactions: () => {
        return get().transactions.filter((transaction) => isPendingStatus(transaction.syncStatus));
      },
      getFailedTransactions: () => {
        return get().transactions.filter((transaction) => transaction.syncStatus === SyncStatus.FAILED);
      },
      updateTransaction: (transactionId, patch) => {
        set((state) => ({
          currentTransaction:
            state.currentTransaction?.id === transactionId
              ? normalizeTransaction({ ...state.currentTransaction, ...patch })
              : state.currentTransaction,
          transactions: state.transactions.map((transaction) =>
            transaction.id === transactionId
              ? normalizeTransaction({ ...transaction, ...patch })
              : transaction
          )
        }));
      },
      updateTransactionSyncStatus: (transactionId, syncStatus, options) => {
        const lastSyncAttempt = options?.lastSyncAttempt ?? new Date().toISOString();
        const applySyncPatch = (transaction: MockTransaction): MockTransaction => ({
          ...transaction,
          syncStatus,
          lastSyncAttempt,
          retryCount: options?.incrementRetry ? transaction.retryCount + 1 : transaction.retryCount
        });

        set((state) => ({
          currentTransaction:
            state.currentTransaction?.id === transactionId
              ? applySyncPatch(state.currentTransaction)
              : state.currentTransaction,
          transactions: state.transactions.map((transaction) =>
            transaction.id === transactionId ? applySyncPatch(transaction) : transaction
          )
        }));
      },
      createTransaction: async (payload) => {
        const state = get();
        const driver = state.selectedDriver;

        if (!driver) {
          throw new Error("Aucun chauffeur sélectionné.");
        }

        const localTransaction = createLocalTransaction(
          payload,
          driver,
          state.transactions.length + 1,
          SyncStatus.LOCAL_PENDING
        );

        set({ isCreatingTransaction: true, transactionError: null });

        try {
          const syncedTransaction = await createBackendTransaction({
            ...payload,
            driver
          });

          const transaction = normalizeTransaction({
            ...localTransaction,
            ...syncedTransaction,
            stationSessionId: payload.stationSessionId,
            stationId: payload.stationId,
            pumpId: payload.pumpId,
            driver,
            fuelType: payload.fuelType as FuelType,
            amount: payload.amount,
            liters: payload.liters,
            photo: payload.photo,
            syncStatus: SyncStatus.SYNCED
          });

          set((state) => ({
            isCreatingTransaction: false,
            currentTransaction: transaction,
            transactions: [transaction, ...state.transactions]
          }));

          return transaction;
        } catch (error) {
          const apiError = toApiError(error);

          set((state) => ({
            isCreatingTransaction: false,
            transactionError: apiError.message,
            currentTransaction: localTransaction,
            transactions: [localTransaction, ...state.transactions]
          }));

          return localTransaction;
        }
      },
      clearTransactionError: () => {
        set({ transactionError: null });
      }
    }),
    {
      name: "transaction-store",
      version: 2,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<TransactionState>;

        return {
          ...state,
          selectedDriver: state.selectedDriver ?? null,
          currentTransaction: state.currentTransaction
            ? normalizeTransaction(state.currentTransaction)
            : null,
          transactions: (state.transactions ?? []).map(normalizeTransaction)
        };
      },
      storage: createJSONStorage(() => zustandStorage)
    }
  )
);
