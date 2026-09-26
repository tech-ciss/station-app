export type MockDriver = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  fuelType: "SUPER" | "GASOIL";
  qrCodeToken?: string | null;
  status?: string;
};
