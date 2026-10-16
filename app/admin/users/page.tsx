import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { grantAccessAction, setRoleAction } from "@/app/actions/admin";
import { entitlementFor, TRIAL_DAYS } from "@/lib/access";
import { isAdmin } from "@/lib/auth";
import { snapshot } from "@/lib/store";
import { currency, formatDate, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Members · Publisher" };

export default async function AdminUsersPage() {
  if (!(await isAdmin())) redirect("/signin?next=/admin/users");
  const store = snapshot();
  const revenue = store.payments
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-16 md:px-10">
      <p className="text-[10.5px] font-semibold tracking-[0.34em] text-gold-500 uppercase">
        Publisher dashboard
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-cream md:text-4xl">
        Members & access
      </h1>
      <div className="mt-6">
        <AdminNav active="/admin/users" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Members" value={String(store.users.length)} />
        <Stat label="Trial length" value={`${TRIAL_DAYS} days`} />
        <Stat label="Recorded revenue" value={currency(revenue, "KES")} />
      </div>

      <div className="mt-6 rounded-2xl border border-cream/10 bg-ink-900/70 p-5">
        <h2 className="font-display text-lg font-bold text-cream">Grant access by email</h2>
        <form action={grantAccessAction} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex-1">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.2em] text-cream-dim uppercase">
              Email
            </span>
            <input
              name="email"
              type="email"
              required
              placeholder="member@example.com"
              className="w-full rounded-lg border border-cream/15 bg-ink-950/70 px-3 py-2.5 text-[13px] text-cream"
            />
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.2em] text-cream-dim uppercase">
              Days
            </span>
            <input
              name="days"
              type="number"
              defaultValue={365}
              className="w-24 rounded-lg border border-cream/15 bg-ink-950/70 px-3 py-2.5 text-[13px] text-cream"
            />
          </label>
          <input type="hidden" name="action" value="grant" />
          <button className="btn btn-gold text-sm">Grant full access</button>
        </form>
        <p className="mt-3 text-[12px] text-cream-dim">
          Useful for the members who support with a coffee, or for a family account.
        </p>
      </div>

      <section className="mt-8 overflow-x-auto rounded-2xl border border-cream/10 bg-ink-900/60 p-5">
        <h2 className="font-display text-lg font-bold text-cream">Accounts</h2>
        <table className="mt-4 w-full min-w-[720px] text-left text-[13px]">
          <thead className="text-[10.5px] tracking-[0.2em] text-cream-dim uppercase">
            <tr>
              <th className="pb-2">Member</th>
              <th className="pb-2">Joined</th>
              <th className="pb-2">Access</th>
              <th className="pb-2">Ends</th>
              <th className="pb-2">Role</th>
              <th className="pb-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {store.users.map((user) => {
              const entitlement = entitlementFor(user);
              return (
                <tr key={user.id} className="border-t border-cream/8">
                  <td className="py-3 pr-4">
                    <span className="block text-cream">{user.displayName}</span>
                    <span className="block text-[11.5px] text-cream-dim">{user.email}</span>
                  </td>
                  <td className="py-3 pr-4 text-cream-dim">{formatDate(user.createdAt)}</td>
                  <td className="py-3 pr-4">
                    <span className={entitlement.active ? "text-teal-400" : "text-coral-400"}>
                      {entitlement.active ? entitlement.source : "expired"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-cream-dim">
                    {entitlement.expiresAt ? formatDateTime(entitlement.expiresAt) : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <form action={setRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="email" value={user.email} />
                      <select
                        name="role"
                        defaultValue={user.role}
                        className="rounded-lg border border-cream/15 bg-ink-950/70 px-2 py-1.5 text-[12px] text-cream"
                      >
                        <option value="reader">reader</option>
                        <option value="editor">editor</option>
                        <option value="admin">admin</option>
                      </select>
                      <button className="text-[11.5px] text-gold-400 hover:underline">save</button>
                    </form>
                  </td>
                  <td className="py-3 text-right">
                    <form action={grantAccessAction} className="inline">
                      <input type="hidden" name="email" value={user.email} />
                      <input type="hidden" name="action" value="revoke" />
                      <button className="text-[11.5px] text-coral-400 hover:underline">revoke</button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {store.users.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-cream-dim">
                  No accounts yet. The first signup appears here with its 90-day trial clock.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="mt-8 overflow-x-auto rounded-2xl border border-cream/10 bg-ink-900/60 p-5">
        <h2 className="font-display text-lg font-bold text-cream">Payments</h2>
        {store.payments.length === 0 ? (
          <p className="mt-3 text-[13px] text-cream-dim">
            Nothing recorded yet. Paystack transactions appear here automatically (and by webhook
            when keys are configured).
          </p>
        ) : (
          <table className="mt-4 w-full min-w-[560px] text-left text-[13px]">
            <thead className="text-[10.5px] tracking-[0.2em] text-cream-dim uppercase">
              <tr>
                <th className="pb-2">Reference</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">When</th>
              </tr>
            </thead>
            <tbody>
              {store.payments.map((p) => (
                <tr key={p.id} className="border-t border-cream/8">
                  <td className="py-2.5 pr-4 font-mono text-[11.5px] text-cream-dim">{p.reference}</td>
                  <td className="py-2.5 pr-4 text-cream">{p.email}</td>
                  <td className="py-2.5 pr-4 text-cream">
                    {p.currency} {p.amount.toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={
                        p.status === "success"
                          ? "text-teal-400"
                          : p.status === "pending"
                            ? "text-gold-400"
                            : "text-coral-400"
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-cream-dim">{formatDateTime(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-cream/10 bg-ink-900/60 p-4">
      <p className="text-[10px] font-semibold tracking-[0.22em] text-cream-dim uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-cream">{value}</p>
    </div>
  );
}
