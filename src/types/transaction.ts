import type { MockDriver } from "@/types/driver";

export type FuelType = "SUPER" | "GASOIL";

export enum TransactionSyncStatus {
  LOCAL_PENDING = "LOCAL_PENDING",
  SYNCING = "SYNCING",
  SYNCED = "SYNCED",
  FAILED = "FAILED",
  PENDING = "PENDING"
}

export type TransactionSyncStatusValue = TransactionSyncStatus;

export type TransactionPhoto = {
  id: string;
  uri: string;
  source: "camera" | "gallery";
};

export type TransactionPayload = {
  driverId: string;
  fuelType: FuelType;
  amount: number;
  liters: number;
  photo: TransactionPhoto;
  stationSessionId: string;
};

export type MockTransaction = TransactionPayload & {
  id: string;
  reference: string;
  remoteId?: string;
  driverQrCodeToken?: string;
  stationId: string;
  pumpId: string;
  driver: MockDriver;
  syncStatus: TransactionSyncStatusValue;
  retryCount: number;
  lastSyncAttempt: string | null;
  createdAt: string;
};
