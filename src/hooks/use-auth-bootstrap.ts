import { useEffect } from "react";

import { useAuthStore } from "@/store/auth.store";

export function useAuthBootstrap() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const isBootstrapped = useAuthStore((state) => state.isBootstrapped);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return {
    isBootstrapped,
    isBootstrapping
  };
}
