import { MMKV } from "react-native-mmkv";
import type { StateStorage } from "zustand/middleware";

function createMMKVStorage() {
  try {
    return new MMKV({
      id: "yely-station-storage"
    });
  } catch (error) {
    console.warn("MMKV unavailable, using in-memory storage for this runtime.", error);
    return null;
  }
}

const memoryStorage = new Map<string, string>();

export const mmkv = createMMKVStorage();
export const isMMKVAvailable = mmkv !== null;

export const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    if (mmkv) {
      mmkv.set(name, value);
      return;
    }

    memoryStorage.set(name, value);
  },
  getItem: (name) => {
    if (mmkv) {
      return mmkv.getString(name) ?? null;
    }

    return memoryStorage.get(name) ?? null;
  },
  removeItem: (name) => {
    if (mmkv) {
      mmkv.delete(name);
      return;
    }

    memoryStorage.delete(name);
  }
};
