import type { TransactionSyncStatus } from "@/types/transaction";

export type OfflineSyncResult = {
  transactionId: string;
  status: TransactionSyncStatus;
  retryCount: number;
};

export type NetworkListener = (isOnline: boolean) => void;
