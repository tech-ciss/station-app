import { useMemo } from "react";

import { useTransactionStore } from "@/store/transaction.store";
import { TransactionSyncStatus } from "@/types/transaction";

export function useFailedTransactions() {
  const transactions = useTransactionStore((state) => state.transactions);

  return useMemo(
    () =>
      transactions.filter(
        (transaction) => transaction.syncStatus === TransactionSyncStatus.FAILED
      ),
    [transactions]
  );
}
