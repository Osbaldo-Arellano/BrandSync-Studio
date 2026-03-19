# Jobs Dashboard Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Jobs status breakdown panel and Recent Jobs section to the dashboard home page.

**Architecture:** Two-file change — `app/dashboard/page.tsx` adds a parallel jobs query; `components/dashboard/DashboardHome.tsx` adds a `JobSummary` type, a third status-breakdown card, and a third recent-activity column.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase, Tailwind CSS v4

---

### Task 1: Fetch jobs in the dashboard page

**Files:**
- Modify: `app/dashboard/page.tsx`

**Step 1: Replace the file with the updated version**

```tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: estimates }, { data: invoices }, { data: jobs }, { data: tenant }] = await Promise.all([
    supabase
      .from("estimates")
      .select("id, estimate_number, customer_name, status, total, created_at")
      .eq("tenant_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, customer_name, status, total, created_at")
      .eq("tenant_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("jobs")
      .select("id, title, status, created_at")
      .eq("tenant_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("tenants")
      .select("name")
      .eq("id", user.id)
      .single(),
  ]);

  return (
    <DashboardHome
      estimates={estimates ?? []}
      invoices={invoices ?? []}
      jobs={jobs ?? []}
      tenantName={tenant?.name ?? ""}
    />
  );
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: zero TypeScript errors (will fail until Task 2 adds the `jobs` prop to `DashboardHome`)

---

### Task 2: Add Jobs to DashboardHome component

**Files:**
- Modify: `components/dashboard/DashboardHome.tsx`

**Step 1: Add the `JobSummary` type** — after the `InvoiceSummary` type definition (around line 43) add:

```tsx
type JobSummary = {
  id: string;
  title: string;
  status: string;
  created_at: string;
};
```

**Step 2: Add the job status badge map** — after the `INV_BADGE` constant add:

```tsx
const JOB_BADGE: Record<string, string> = {
  active:    "bg-blue-50 text-blue-700 border border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled: "bg-gray-100 text-gray-600 border border-gray-200",
};
```

**Step 3: Add `jobs` to the component props** — update the `DashboardHome` function signature:

```tsx
export function DashboardHome({
  estimates,
  invoices,
  jobs,
  tenantName,
}: {
  estimates: EstimateSummary[];
  invoices: InvoiceSummary[];
  jobs: JobSummary[];
  tenantName: string;
}) {
```

**Step 4: Add job counts** — inside the component body, after the invoice counts block (after `const invTotal = filteredInvoices.length;`), add:

```tsx
  // Job counts (not period-filtered — jobs are ongoing, not time-boxed)
  const jobActive    = jobs.filter(j => j.status === "active").length;
  const jobCompleted = jobs.filter(j => j.status === "completed").length;
  const jobCancelled = jobs.filter(j => j.status === "cancelled").length;
  const jobTotal     = jobs.length;

  // Recent jobs
  const recentJobs = jobs.slice(0, 6);
```

**Step 5: Update the status breakdown grid** — change the grid from 2-col to 3-col and add the Jobs card.

Find this line:
```tsx
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```
Replace with:
```tsx
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

Then after the closing `</div>` of the Invoices card (but still inside the grid div), add:

```tsx
        {/* Jobs */}
        <div className="bg-white border border-gray-200 rounded px-5 py-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Jobs</p>
            <Link href="/dashboard/jobs" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-2.5">
            <StatusBar label="Active"    count={jobActive}    total={jobTotal} barClass="bg-blue-400"    href="/dashboard/jobs?status=active" />
            <StatusBar label="Completed" count={jobCompleted} total={jobTotal} barClass="bg-emerald-400" href="/dashboard/jobs?status=completed" />
            <StatusBar label="Cancelled" count={jobCancelled} total={jobTotal} barClass="bg-gray-300"    href="/dashboard/jobs?status=cancelled" />
          </div>
          <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">
            {jobTotal} total · {jobActive} active
          </p>
        </div>
```

**Step 6: Update the recent activity grid** — change from 2-col to 3-col.

Find:
```tsx
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
```
Replace with:
```tsx
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
```

**Step 7: Add the Recent Jobs section** — after the closing `</div>` of the "Recent invoices" section (but still inside the grid div), add:

```tsx
        {/* Recent jobs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Recent Jobs</h2>
            <Link href="/dashboard/jobs" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded p-8 text-center">
              <p className="text-sm text-gray-400">No jobs yet.</p>
              <Link href="/dashboard/jobs" className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-700 font-medium">
                Create your first →
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {recentJobs.map((job) => (
                    <tr
                      key={job.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{job.title || "—"}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{job.id.slice(0, 8).toUpperCase()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ${JOB_BADGE[job.status] ?? ""}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-xs text-gray-400">{fmtDate(job.created_at)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
```

**Step 8: Verify build and tests pass**

Run: `npm run build && npm test`
Expected: zero errors, 92 tests pass

**Step 9: Commit**

```bash
git add app/dashboard/page.tsx components/dashboard/DashboardHome.tsx
git commit -m "feat: add jobs to dashboard home (status breakdown + recent activity)"
```

---

### Verification

After all tasks:
```bash
npm run build   # must pass with zero errors
npm test        # 92 tests green
```

Visual check: navigate to `/dashboard` and confirm:
- Status breakdown shows 3 cards: Estimates, Invoices, Jobs
- Recent activity shows 3 columns: Recent Estimates, Recent Invoices, Recent Jobs
- Job status chips match the design system colors
- Clicking a recent job row navigates to `/dashboard/jobs/[id]`
