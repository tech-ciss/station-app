import { useMemo } from "react";

import { useTransactionStore } from "@/store/transaction.store";
import { TransactionSyncStatus } from "@/types/transaction";

export function usePendingTransactions() {
  const transactions = useTransactionStore((state) => state.transactions);

  return useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.syncStatus === TransactionSyncStatus.LOCAL_PENDING ||
          transaction.syncStatus === TransactionSyncStatus.PENDING ||
          transaction.syncStatus === TransactionSyncStatus.SYNCING
      ),
    [transactions]
  );
}
