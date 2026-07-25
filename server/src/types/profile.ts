export interface Profile {
  id: string;
  fullName: string | null;
  phone: string | null;
  address: string | null;
  role: "customer" | "admin";
  createdAt: string;
}
