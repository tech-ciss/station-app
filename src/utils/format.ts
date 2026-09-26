import type { FuelType } from "@/types/transaction";

export function formatMoney(amount: number, currency = "FCFA") {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `${new Intl.NumberFormat("fr-FR").format(safeAmount)} ${currency}`;
}

export function formatLiters(liters: number) {
  const safeLiters = Number.isFinite(liters) ? liters : 0;
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(safeLiters)} L`;
}

export function parseDecimalInput(value: string) {
  const normalized = value.replace(/\s+/g, "").replace(/,/g, ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function parseMoneyInput(value: string) {
  const normalized = value.replace(/\s+/g, "").replace(/,/g, ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed) : NaN;
}

export function formatFuelType(fuelType?: FuelType | string) {
  const normalized = String(fuelType ?? "").toUpperCase();

  if (normalized === "GASOIL" || normalized === "DIESEL") {
    return "Gasoil";
  }

  if (normalized === "SUPER" || normalized === "ESSENCE" || normalized === "GASOLINE") {
    return "Super";
  }

  return fuelType ? String(fuelType) : "-";
}

export function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsed);
}

export function formatDate(value?: string) {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatTime(value?: string) {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}