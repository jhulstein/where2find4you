import { LockKeyhole } from "lucide-react";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const errorMessage =
    params.error === "invalid"
      ? "Wrong admin password."
      : params.error === "not-configured"
        ? "Admin password is not configured."
        : null;

  return (
    <main>
      <ResponsiveContainer className="py-12 sm:py-16">
        <section className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
            <LockKeyhole aria-hidden="true" size={20} />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-slate-950">Admin access</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sign in with the administrator password to continue.
          </p>
          {errorMessage ? (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}
          <form action="/api/admin/login" method="post" className="mt-5 grid gap-3">
            <input type="hidden" name="next" value={params.next ?? "/admin"} />
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Password
              <input
                name="password"
                type="password"
                required
                className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </label>
            <button className="min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
              Continue
            </button>
          </form>
        </section>
      </ResponsiveContainer>
    </main>
  );
}
