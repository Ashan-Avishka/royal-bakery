import Link from "next/link";
import { CustomerDetailPanel } from "@/components/admin/CustomerDetailPanel";
import { CustomerRoleForm } from "@/components/admin/CustomerRoleForm";
import { Badge } from "@/components/ui/Badge";
import { DetailPanel, DetailPanelPlaceholder } from "@/components/ui/DetailPanel";
import { listAdminCustomers } from "@/lib/admin/customers";
import { requireAdminSession } from "@/lib/admin/session";
import { buildQuery } from "@/lib/queryString";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; selected?: string }>;
}) {
  const { role: roleFilter, selected } = await searchParams;
  const session = await requireAdminSession();
  const customers = await listAdminCustomers(session.accessToken);

  const filtered =
    roleFilter === "admin" || roleFilter === "customer"
      ? customers.filter((c) => c.role === roleFilter)
      : customers;

  const selectedCustomer = selected
    ? (customers.find((c) => c.id === selected) ?? null)
    : null;
  const closeHref = `/admin/customers${buildQuery({ role: roleFilter })}`;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-2 font-display text-3xl text-cocoa">Customers</h1>
      <p className="mb-6 text-sm text-text-muted">
        View accounts and promote or demote admin access.
      </p>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className={`min-w-0 flex-1 ${selected ? "hidden lg:block" : ""}`}>
          <div className="mb-8 flex flex-wrap gap-2">
            {(
              [
                { value: "all", label: "All", href: "/admin/customers" },
                {
                  value: "customer",
                  label: "Customers",
                  href: "/admin/customers?role=customer",
                },
                {
                  value: "admin",
                  label: "Admins",
                  href: "/admin/customers?role=admin",
                },
              ] as const
            ).map((filter) => {
              const active =
                filter.value === "all"
                  ? !roleFilter
                  : roleFilter === filter.value;
              return (
                <Link
                  key={filter.value}
                  href={filter.href}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-caramel text-cream-alt"
                      : "bg-honey-light/50 text-cocoa hover:bg-honey-light"
                  }`}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-text-muted">No accounts found.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border-warm border-y border-border-warm">
              {filtered.map((customer) => {
                const isSelf = customer.id === session.userId;
                const isActive = customer.id === selected;
                const rowHref = `/admin/customers${buildQuery({
                  role: roleFilter,
                  selected: customer.id,
                })}`;
                return (
                  <li
                    key={customer.id}
                    className={`flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between ${
                      isActive ? "bg-honey-light/40" : ""
                    }`}
                  >
                    <Link href={rowHref} className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-cocoa">
                          {customer.fullName?.trim() || "Unnamed user"}
                        </p>
                        <Badge
                          tone={customer.role === "admin" ? "honey" : "muted"}
                        >
                          {customer.role}
                        </Badge>
                        {isSelf && <Badge tone="success">You</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-text-muted">
                        {customer.phone || "No phone"}
                        {customer.address ? ` · ${customer.address}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        Joined{" "}
                        {new Date(customer.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </Link>
                    <CustomerRoleForm
                      customerId={customer.id}
                      currentRole={customer.role}
                      isSelf={isSelf}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className={`w-full shrink-0 lg:w-96 ${selected ? "" : "hidden lg:block"}`}>
          {selected ? (
            <DetailPanel title="Customer details" closeHref={closeHref}>
              {selectedCustomer ? (
                <CustomerDetailPanel
                  customer={selectedCustomer}
                  isSelf={selectedCustomer.id === session.userId}
                />
              ) : (
                <p className="text-sm text-text-muted">
                  This customer could not be found.
                </p>
              )}
            </DetailPanel>
          ) : (
            <DetailPanelPlaceholder message="Select a customer to see their details." />
          )}
        </aside>
      </div>
    </div>
  );
}
