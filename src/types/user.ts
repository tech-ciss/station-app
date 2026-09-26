export type StationUser = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  role: "CASHIER" | "cashier" | "manager" | string;
  status?: "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED" | string;
  stationId?: string;
  stationName?: string;
  stationCode?: string;
};
