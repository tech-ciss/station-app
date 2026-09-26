import { apiClient } from "@/services/api/client";
import { unwrapApiData, unwrapApiList } from "@/services/api/response";
import { uploadPumpPhoto } from "@/features/transactions/services/uploads.api";
import type { MockDriver } from "@/types/driver";
import type { FuelType, MockTransaction, TransactionPayload } from "@/types/transaction";
import { TransactionSyncStatus } from "@/types/transaction";

type BackendFuelType = "GASOLINE" | "DIESEL";

type BackendTransaction = {
  id?: string;
  _id?: string;
  reference?: string;
  driverId?: string;
  driver?: Partial<MockDriver>;
  driverQrCodeToken?: string;
  stationId?: string;
  station?: { id?: string; name?: string };
  pumpId?: string;
  pump?: { id?: string; label?: string; name?: string; pumpCode?: string };
  workSessionId?: string;
  stationWorkSessionId?: string;
  workSession?: { id?: string };
  liters?: number | string;
  amount?: number | string;
  fuelType?: BackendFuelType | FuelType | string;
  pumpPhotoUrl?: string;
  photoUrl?: string;
  proofPhotoUrl?: string;
  receiptPhotoUrl?: string;
  imageUrl?: string;
  photo?: {
    uri?: string;
    url?: string;
    fileUrl?: string;
    path?: string;
  };
  createdAt?: string;
  confirmedAt?: string;
  status?: string;
};

export type CreateBackendTransactionPayload = TransactionPayload & {
  stationId: string;
  pumpId: string;
  driver: MockDriver;
};

type TransactionNormalizerFallback = Partial<CreateBackendTransactionPayload> & {
  driverQrCodeToken?: string;
  retryCount?: number;
};

function appFuelToBackend(fuelType: FuelType): BackendFuelType {
  return fuelType === "GASOIL" ? "DIESEL" : "GASOLINE";
}

function backendFuelToApp(fuelType?: string): FuelType {
  return fuelType === "DIESEL" || fuelType === "GASOIL" ? "GASOIL" : "SUPER";
}

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function isUploadUrl(uri: string) {
  return uri.startsWith("http://") || uri.startsWith("https://") || uri.startsWith("/");
}

function getTransactionPhotoUri(transaction: BackendTransaction) {
  return (
    transaction.pumpPhotoUrl ??
    transaction.photoUrl ??
    transaction.proofPhotoUrl ??
    transaction.receiptPhotoUrl ??
    transaction.imageUrl ??
    transaction.photo?.uri ??
    transaction.photo?.url ??
    transaction.photo?.fileUrl ??
    transaction.photo?.path ??
    ""
  );
}

export function normalizeBackendTransaction(
  transaction: BackendTransaction,
  fallback?: TransactionNormalizerFallback
): MockTransaction {
  const id = transaction.id ?? transaction._id ?? fallback?.stationSessionId ?? `remote-${Date.now()}`;
  const driver = {
    id: transaction.driverId ?? transaction.driver?.id ?? fallback?.driver?.id ?? fallback?.driverId ?? "driver",
    firstName: transaction.driver?.firstName ?? fallback?.driver?.firstName ?? "Chauffeur",
    lastName: transaction.driver?.lastName ?? fallback?.driver?.lastName ?? "YELY",
    phone: transaction.driver?.phone ?? fallback?.driver?.phone ?? "-",
    fuelType: backendFuelToApp(transaction.fuelType) as FuelType,
    qrCodeToken: transaction.driverQrCodeToken ?? fallback?.driver?.qrCodeToken ?? null
  };

  return {
    id,
    remoteId: transaction.id ?? transaction._id,
    reference: transaction.reference ?? `YELY-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    driverId: driver.id,
    driverQrCodeToken: transaction.driverQrCodeToken ?? fallback?.driverQrCodeToken,
    fuelType: backendFuelToApp(transaction.fuelType ?? fallback?.fuelType),
    amount: toNumber(transaction.amount ?? fallback?.amount),
    liters: toNumber(transaction.liters ?? fallback?.liters),
    photo:
      fallback?.photo ?? {
        id: "remote-photo",
        uri: getTransactionPhotoUri(transaction),
        source: "camera"
      },
    stationSessionId:
      transaction.workSessionId ??
      transaction.stationWorkSessionId ??
      transaction.workSession?.id ??
      fallback?.stationSessionId ??
      "",
    stationId: transaction.stationId ?? transaction.station?.id ?? fallback?.stationId ?? "",
    pumpId: transaction.pumpId ?? transaction.pump?.id ?? fallback?.pumpId ?? "",
    driver,
    syncStatus: TransactionSyncStatus.SYNCED,
    retryCount: fallback?.retryCount ?? 0,
    lastSyncAttempt: new Date().toISOString(),
    createdAt: transaction.confirmedAt ?? transaction.createdAt ?? new Date().toISOString()
  };
}

export async function createTransaction(payload: CreateBackendTransactionPayload) {
  const pumpPhotoUrl = isUploadUrl(payload.photo.uri)
    ? payload.photo.uri
    : await uploadPumpPhoto(payload.photo.uri);

  const { data } = await apiClient.post("/transactions", {
    driverId: payload.driverId,
    driverQrCodeToken: payload.driver.qrCodeToken,
    liters: payload.liters,
    amount: payload.amount,
    fuelType: appFuelToBackend(payload.fuelType),
    pumpPhotoUrl
  });

  return normalizeBackendTransaction(unwrapApiData<BackendTransaction>(data), payload);
}

export async function fetchMyTransactions(params?: {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  const { data } = await apiClient.get("/cashiers/me/transactions", {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 100,
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo
    }
  });

  return unwrapApiList<BackendTransaction>(data).map((transaction) =>
    normalizeBackendTransaction(transaction)
  );
}

export async function fetchTransactionById(transactionId: string) {
  const { data } = await apiClient.get(`/transactions/${transactionId}`);
  return normalizeBackendTransaction(unwrapApiData<BackendTransaction>(data));
}
