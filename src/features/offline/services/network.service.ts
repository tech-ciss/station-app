import type { NetworkListener } from "@/features/offline/types/offline.types";

let online = true;
const listeners = new Set<NetworkListener>();

export const networkService = {
  async isOnline() {
    return online;
  },
  subscribe(listener: NetworkListener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
  setMockOnline(nextOnline: boolean) {
    online = nextOnline;
    listeners.forEach((listener) => listener(online));
  }
};
