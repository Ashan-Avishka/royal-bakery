import { api } from "@/lib/api";

export type UserRole = "customer" | "admin";

export interface AdminCustomer {
  id: string;
  fullName: string | null;
  phone: string | null;
  address: string | null;
  role: UserRole;
  createdAt: string;
}

export async function listAdminCustomers(
  accessToken: string
): Promise<AdminCustomer[]> {
  const { customers } = await api<{ customers: AdminCustomer[] }>(
    "/api/admin/customers",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return customers;
}

export async function updateAdminCustomerRole(
  accessToken: string,
  id: string,
  role: UserRole
): Promise<AdminCustomer> {
  const { customer } = await api<{ customer: AdminCustomer }>(
    `/api/admin/customers/${id}/role`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ role }),
    }
  );
  return customer;
}
