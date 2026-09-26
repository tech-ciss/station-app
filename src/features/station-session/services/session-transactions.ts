import type { StationSession } from "@/types/session";
import type { MockTransaction } from "@/types/transaction";

export function getSessionTransactions(
  transactions: MockTransaction[],
  session: StationSession
) {
  const sessionKeys = new Set([session.id, session.openedAt].filter(Boolean));
  const openedAtTime = new Date(session.openedAt).getTime();

  return transactions.filter((transaction) => {
    if (sessionKeys.has(transaction.stationSessionId)) {
      return true;
    }

    const transactionTime = new Date(transaction.createdAt).getTime();
    const sameOperationalContext =
      transaction.stationId === session.stationId && transaction.pumpId === session.pumpId;

    return (
      sameOperationalContext &&
      Number.isFinite(openedAtTime) &&
      Number.isFinite(transactionTime) &&
      transactionTime >= openedAtTime
    );
  });
}
