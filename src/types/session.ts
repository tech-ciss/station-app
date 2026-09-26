export type StationSession = {
  id?: string;
  stationId: string;
  stationName: string;
  pumpId: string;
  pumpName: string;
  cashierId: string;
  openedAt: string;
  isActive: boolean;
};

export type Pump = {
  id: string;
  name: string;
  code?: string;
  fuelType?: "SUPER" | "GASOIL";
  status: "AVAILABLE" | "OCCUPIED";
  isActive?: boolean;
};
