import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { zustandStorage } from "@/services/storage/mmkv";

type SyncStats = {
  pendingCount: number;
  failedCount: number;
  syncedCount: number;
};

type SyncState = SyncStats & {
  isSyncing: boolean;
  lastSyncAt: string | null;
  startSync: () => void;
  stopSync: () => void;
  updateStats: (stats: Partial<SyncStats>) => void;
};

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      isSyncing: false,
      lastSyncAt: null,
      pendingCount: 0,
      failedCount: 0,
      syncedCount: 0,
      startSync: () => {
        set({ isSyncing: true });
      },
      stopSync: () => {
        set({
          isSyncing: false,
          lastSyncAt: new Date().toISOString()
        });
      },
      updateStats: (stats) => {
        set(stats);
      }
    }),
    {
      name: "sync-store",
      storage: createJSONStorage(() => zustandStorage)
    }
  )
);
