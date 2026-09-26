import { apiClient } from "@/services/api/client";
import { unwrapApiData } from "@/services/api/response";
import type { MockDriver } from "@/types/driver";

type BackendDriver = {
  id?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: string;
  qrCodeToken?: string | null;
};

export function normalizeDriver(driver: BackendDriver, qrCodeToken?: string): MockDriver {
  return {
    id: driver.id ?? qrCodeToken ?? "driver-unknown",
    firstName: driver.firstName ?? "Chauffeur",
    lastName: driver.lastName ?? "YELY",
    phone: driver.phone ?? "-",
    fuelType: "SUPER",
    qrCodeToken: qrCodeToken ?? driver.qrCodeToken ?? null,
    status: driver.status
  };
}

export async function resolveDriverByQr(qrCodeToken: string) {
  const { data } = await apiClient.get(
    `/drivers/resolve-by-qr/${encodeURIComponent(qrCodeToken)}`
  );

  return normalizeDriver(unwrapApiData<BackendDriver>(data), qrCodeToken);
}
