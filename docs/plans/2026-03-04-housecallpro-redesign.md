# HouseCall Pro Light Theme Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace every dark zinc/black surface with a clean light theme, make all corners angular (4px max), flip status chips to light-on-white, and adopt Inter font — matching HouseCall Pro's professional B2B aesthetic across all 15 files.

**Architecture:** Pure Tailwind class replacement — no new components, no new abstractions. Every dark class has a direct light equivalent. The document card inside estimates stays white (already correct) but all surrounding chrome flips from dark to light.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, Inter (Google Fonts)

---

## Token Map (dark → light)

```
bg-zinc-950          → bg-gray-50          (page shell)
bg-zinc-900          → bg-white            (cards, sidebar, header)
bg-zinc-900/50       → bg-gray-50
bg-zinc-800          → bg-gray-100         (table header, hover rows)
bg-zinc-800/40       → bg-gray-100/60      (table row hover)
bg-zinc-800/60       → bg-white            (inputs)
bg-zinc-700          → bg-gray-200         (active nav, selected tab)
border-zinc-800      → border-gray-200
border-zinc-800/70   → border-gray-200
border-zinc-700      → border-gray-300
border-zinc-600      → border-gray-300
text-zinc-100        → text-gray-900
text-zinc-200        → text-gray-800
text-zinc-300        → text-gray-700
text-zinc-400        → text-gray-500
text-zinc-500        → text-gray-400
text-zinc-600        → text-gray-300
placeholder-zinc-500 → placeholder-gray-400
rounded-xl           → rounded            (4px)
rounded-lg           → rounded            (4px)
rounded-full (badge) → rounded            (4px)
```

## Status Badge Map (dark → light chips)

```
draft:    bg-zinc-700 text-zinc-300        → bg-gray-100 text-gray-600 border border-gray-200
sent:     bg-blue-500/20 text-blue-300     → bg-blue-50 text-blue-700 border border-blue-200
approved: bg-amber-500/20 text-amber-300   → bg-amber-50 text-amber-700 border border-amber-200
invoiced: bg-green-500/20 text-green-300   → bg-emerald-50 text-emerald-700 border border-emerald-200
paid:     bg-green-500/20 text-green-300   → bg-emerald-50 text-emerald-700 border border-emerald-200
overdue:  bg-red-500/20 text-red-300       → bg-red-50 text-red-700 border border-red-200
declined: bg-rose-500/20 text-rose-300     → bg-red-50 text-red-700 border border-red-200
```

## Button Map

```
Primary:   bg-zinc-100 text-zinc-900  → bg-blue-600 text-white hover:bg-blue-700
Secondary: border-zinc-700 text-zinc-300 → border-gray-300 text-gray-700 hover:bg-gray-50
Danger:    bg-red-600 text-white      → (keep, just change rounded-lg → rounded)
Send/CTA:  bg-blue-600 text-white     → (keep color, change rounded-lg → rounded)
```

---

### Task 1: globals.css + layout.tsx (font + base tokens)

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Step 1: Update globals.css**

Replace entire file with:

```css
@import "tailwindcss";

@keyframes slide-up {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
.animate-slide-up {
  animation: slide-up 0.22s cubic-bezier(0.32, 0.72, 0, 1);
}

:root {
  --background: #ffffff;
  --foreground: #111827;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-inter);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), system-ui, sans-serif;
}
```

**Step 2: Update app/layout.tsx** — swap Geist for Inter:

```tsx
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
```

Change body className to: `${inter.variable} ${geistMono.variable} antialiased`

**Step 3: Commit**
```bash
git add app/globals.css app/layout.tsx
git commit -m "style: switch to Inter font + light theme base tokens"
```

---

### Task 2: Dashboard layout (sidebar + shell)

**File:** `app/dashboard/layout.tsx`

Replace dark shell with light:

```
div wrapper:  bg-zinc-950 text-zinc-100  →  bg-gray-50 text-gray-900
aside:        border-zinc-800 bg-zinc-900  →  border-gray-200 bg-white
logo div:     border-zinc-800  →  border-gray-200
logo text:    text-zinc-100  →  text-gray-900
close button: text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100  →  text-gray-500 hover:bg-gray-100 hover:text-gray-900
mobile backdrop: bg-black/60  →  bg-black/30
active link:  bg-zinc-800 text-zinc-100  →  bg-blue-50 text-blue-700
  + add:  border-l-2 border-blue-600
inactive link: text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200  →  text-gray-600 hover:bg-gray-50 hover:text-gray-900
```

**Step: Commit**
```bash
git add app/dashboard/layout.tsx
git commit -m "style: light sidebar + shell"
```

---

### Task 3: DashboardHeader

**File:** `components/dashboard/DashboardHeader.tsx`

```
header:       border-zinc-800 bg-zinc-900  →  border-gray-200 bg-white
hamburger:    text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100  →  text-gray-500 hover:bg-gray-100 hover:text-gray-900
email text:   text-zinc-400  →  text-gray-500
logout btn:   border-zinc-700 text-zinc-300 hover:bg-zinc-800  →  border-gray-200 text-gray-600 hover:bg-gray-50
```

---

### Task 4: Login page

**File:** `app/login/page.tsx`

```
page bg:    bg-zinc-950  →  bg-gray-50
card:       border-zinc-800 bg-zinc-900  →  border-gray-200 bg-white shadow-sm
title:      text-zinc-100  →  text-gray-900
subtitle:   text-zinc-400  →  text-gray-500
label:      text-zinc-300  →  text-gray-700
inputs:     border-zinc-700 bg-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500  →  border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500
error:      border-red-500/30 bg-red-500/10 text-red-400  →  border-red-200 bg-red-50 text-red-600
submit btn: bg-zinc-100 text-zinc-900 hover:bg-zinc-200  →  bg-blue-600 text-white hover:bg-blue-700
footer:     text-zinc-500 / text-zinc-300 hover:text-zinc-100  →  text-gray-500 / text-blue-600 hover:text-blue-700
rounded-xl  →  rounded
rounded-lg  →  rounded
```

---

### Task 5: EstimateList

**File:** `components/estimates/EstimateList.tsx`

STATUS_STYLES:
```ts
const STATUS_STYLES: Record<EstimateStatus, string> = {
  draft:    "bg-gray-100 text-gray-600 border border-gray-200",
  sent:     "bg-blue-50 text-blue-700 border border-blue-200",
  approved: "bg-amber-50 text-amber-700 border border-amber-200",
  invoiced: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  declined: "bg-red-50 text-red-700 border border-red-200",
};
```

StatusBadge: change `rounded-full` → `rounded`

List wrapper: `p-4 sm:p-8` → `p-6 sm:p-8`

Title: `text-zinc-100` implied → `text-gray-900` (already default with theme)
Subtitle: `text-zinc-400` → `text-gray-500`

New button: `bg-zinc-100 text-zinc-900 hover:bg-zinc-200` → `bg-blue-600 text-white hover:bg-blue-700 rounded px-4 py-2`

Search input: `border-zinc-700 bg-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500` → `border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none rounded`

Filter tab bar: `bg-zinc-900 border-zinc-800` → `bg-gray-100 border-gray-200`
Active tab: `bg-zinc-700 text-zinc-100` → `bg-white text-gray-900 shadow-sm`
Inactive tab: `text-zinc-400 hover:text-zinc-200` → `text-gray-500 hover:text-gray-700`

Desktop table container: `border-zinc-800 bg-zinc-900 rounded-xl` → `border-gray-200 bg-white rounded`
Table header cells: `text-zinc-400` → `text-gray-500 bg-gray-50`
Table rows: `divide-zinc-800` → `divide-gray-100`
Table row hover: `hover:bg-zinc-800/40` → `hover:bg-gray-50`
ID cell: `text-zinc-300` → `text-gray-400`
Customer cell: `text-zinc-200` → `text-gray-900`
Job cell: `text-zinc-400` → `text-gray-500`
Date cell: `text-zinc-400` → `text-gray-500`
Total cell: `text-zinc-200` → `text-gray-900`
View link: `text-zinc-400 hover:text-zinc-200` → `text-blue-600 hover:text-blue-700`
PDF icon: `text-zinc-500 hover:text-zinc-200` → `text-gray-400 hover:text-gray-600`

Empty state: `text-zinc-500` → `text-gray-400`

Mobile cards: `border-zinc-800 bg-zinc-900 hover:border-zinc-700` → `border-gray-200 bg-white hover:border-gray-300 shadow-sm`
Mobile ID: `text-zinc-500` → `text-gray-400`
Mobile name: `text-zinc-100` → `text-gray-900`
Mobile job: `text-zinc-400` → `text-gray-500`
Mobile date: `text-zinc-500` → `text-gray-400`
Mobile total: `text-zinc-200` → `text-gray-900`

---

### Task 6: EstimateDetail

**File:** `components/estimates/EstimateDetail.tsx`

STATUS_BADGE:
```ts
const STATUS_BADGE: Record<EstimateStatus, string> = {
  draft:    "bg-gray-100 text-gray-600 border border-gray-200",
  sent:     "bg-blue-50 text-blue-700 border border-blue-200",
  approved: "bg-amber-50 text-amber-700 border border-amber-200",
  invoiced: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  declined: "bg-red-50 text-red-700 border border-red-200",
};

const INV_STATUS_BADGE: Record<InvoiceStatus, string> = {
  draft:   "bg-gray-100 text-gray-600 border border-gray-200",
  sent:    "bg-blue-50 text-blue-700 border border-blue-200",
  paid:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  overdue: "bg-red-50 text-red-700 border border-red-200",
};
```

All badge spans: `rounded-full` → `rounded`

Page wrapper: `p-4 sm:p-6 max-w-4xl space-y-5` → add `bg-gray-50 min-h-full` to outer (or leave as-is since shell is already gray-50)

Send modal backdrop: `bg-black/70` → `bg-black/40`
Modal card: `border-zinc-700 bg-zinc-900` → `border-gray-200 bg-white shadow-xl rounded`
Modal title: `text-zinc-100` → `text-gray-900`
Modal subtitle: `text-zinc-400` → `text-gray-500`
Modal label: `text-zinc-400` → `text-gray-600`
Modal email input: `border-zinc-700 bg-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500` → `border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500`
Shareable link box: `border-zinc-700 bg-zinc-800` → `border-gray-200 bg-gray-50`
Link text: `text-zinc-400` → `text-gray-500`
Copy btn: `text-zinc-400 hover:text-zinc-200` → `text-blue-600 hover:text-blue-700`
Cancel btn: `text-zinc-400 hover:text-zinc-200` → `text-gray-500 hover:text-gray-700`
Send btn: keep `bg-blue-600`, change `rounded-lg` → `rounded`

Back link: `text-zinc-400 hover:text-zinc-200` → `text-gray-500 hover:text-gray-700`
Export PDF btn: `border-zinc-700 text-zinc-300 hover:bg-zinc-800` → `border-gray-300 text-gray-600 hover:bg-gray-50 rounded`

Progress steps:
  active: `text-zinc-100` → `text-gray-900`
  done: `text-zinc-400` → `text-gray-400`
  future: `text-zinc-600` → `text-gray-300`
  chevron: `text-zinc-700` → `text-gray-300`

Delivery log: `border-zinc-800 bg-zinc-900/50` → `border-gray-200 bg-white`
Log text: `text-zinc-400` → `text-gray-500`
Log email: `text-zinc-300` → `text-gray-700`
Resend btn: `text-zinc-500 hover:text-zinc-300` → `text-blue-600 hover:text-blue-700`

Declined banner: `border-rose-500/30 bg-rose-500/5` → `border-red-200 bg-red-50`
Declined text: `text-rose-400` → `text-red-700`
Declined sub: `text-zinc-500` → `text-gray-500`

Action bar (draft/sent): `border-zinc-800 bg-zinc-900` → `border-gray-200 bg-white`
Action label: `text-zinc-400` → `text-gray-500`
Discard btn: `border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/50` → `border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200`
Discard confirm label: `text-zinc-400` → `text-gray-500`
Discard cancel: `border-zinc-700 text-zinc-300 hover:bg-zinc-800` → `border-gray-200 text-gray-600 hover:bg-gray-50`
Discard yes: keep red, `rounded-lg` → `rounded`
Resend btn: `border-zinc-700 text-zinc-300 hover:bg-zinc-800` → `border-gray-200 text-gray-600 hover:bg-gray-50 rounded`
Mark Approved: `bg-amber-500 text-zinc-900 hover:bg-amber-400` → `bg-amber-500 text-white hover:bg-amber-600 rounded`
Send to Client: keep `bg-blue-600`, `rounded-lg` → `rounded`

Approved panel: same `border-zinc-800 bg-zinc-900` → `border-gray-200 bg-white`
Generate Invoice btn: `bg-zinc-100 text-zinc-900 hover:bg-zinc-200` → `bg-blue-600 text-white hover:bg-blue-700 rounded`

Invoice panel: `border-green-500/30 bg-zinc-900` → `border-emerald-200 bg-white`
Invoice panel border-b: `border-zinc-800` → `border-gray-100`
Invoice title: `text-zinc-100` → `text-gray-900`
Invoice ID: `text-zinc-500` → `text-gray-400`
Mark Sent btn: `border-zinc-700 text-zinc-300 hover:bg-zinc-700` → `border-gray-200 text-gray-600 hover:bg-gray-50 rounded`
Mark Paid btn: `border-green-600/50 bg-green-600/10 text-green-300 hover:bg-green-600/20` → `border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded`
Paid text: `text-green-400` → `text-emerald-600`
View all link: `text-zinc-500 hover:text-zinc-300` → `text-blue-600 hover:text-blue-700`

All `rounded-xl` → `rounded`
All `rounded-lg` → `rounded`

---

### Task 7: NewEstimateForm

**File:** `components/estimates/NewEstimateForm.tsx`

The document card (white bg, gray-300 border) is already correct — leave it.

Page wrapper: no change needed (inherits gray-50 shell)
Breadcrumb: `text-zinc-400 hover:text-zinc-200` → `text-gray-500 hover:text-gray-700`
Breadcrumb divider: `text-zinc-600` → `text-gray-300`
Breadcrumb title: `text-zinc-100` → `text-gray-900`

Cancel btn: `border-zinc-700 text-zinc-300 hover:bg-zinc-800` → `border-gray-200 text-gray-600 hover:bg-gray-50 rounded`
Save btn: `bg-zinc-100 text-zinc-900 hover:bg-zinc-200` → `bg-blue-600 text-white hover:bg-blue-700 rounded`
Error text: `text-red-400` → `text-red-600`

All `rounded-lg` → `rounded`

---

### Task 8: NewEstimateFormMobile

**File:** `components/estimates/NewEstimateFormMobile.tsx`

Apply same token map to all dark zinc classes. The mobile wizard uses:
- Step header/progress bar: flip to white bg + gray border
- Content areas: white
- Bottom nav bar: white + gray-200 top border (instead of zinc-900)
- Item cards: white + gray-200 border
- Inputs: white bg + gray-300 border
- Primary action buttons: blue-600
- Step indicators: blue for active/done

---

### Task 9: InvoiceList

**File:** `components/invoices/InvoiceList.tsx`

STATUS_STYLES:
```ts
const STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft:   "bg-gray-100 text-gray-600 border border-gray-200",
  sent:    "bg-blue-50 text-blue-700 border border-blue-200",
  paid:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  overdue: "bg-red-50 text-red-700 border border-red-200",
};
```

StatusBadge: `rounded-full` → `rounded`
Search input: dark → light (same pattern as EstimateList)
Filter tab bar: dark → light (same pattern)
Table container: `border-zinc-800 bg-zinc-900 rounded-xl` → `border-gray-200 bg-white rounded`
Header cells: `text-zinc-400` → `text-gray-500 bg-gray-50`
Row divider: `divide-zinc-800` → `divide-gray-100`
Row hover: `hover:bg-zinc-800/40` → `hover:bg-gray-50`
Invoice # cell: `text-zinc-300` → `text-gray-400`
Customer: `text-zinc-200` → `text-gray-900`
Date: `text-zinc-400` → `text-gray-500`
Total: `text-zinc-200` → `text-gray-900`
View estimate link: `text-zinc-600 hover:text-zinc-400` → `text-blue-600 hover:text-blue-700`
Mark Sent btn: `border-zinc-700 text-zinc-300 hover:bg-zinc-700` → `border-gray-200 text-gray-600 hover:bg-gray-50 rounded`
Mark Paid btn: dark green → `border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded`
Paid text: `text-green-400` → `text-emerald-600`
Mobile cards: `border-zinc-800 bg-zinc-900` → `border-gray-200 bg-white shadow-sm rounded`
Empty state: `text-zinc-500` → `text-gray-400`
Header title: default → `text-gray-900`
Header subtitle: `text-zinc-400` → `text-gray-500`
All `rounded-xl` / `rounded-lg` → `rounded`

---

### Task 10: SettingsShell

**File:** `components/dashboard/SettingsShell.tsx`

Left nav: `border-zinc-800` → `border-gray-200`
Nav label: `text-zinc-500` → `text-gray-400`
Active item: `bg-zinc-800 text-zinc-100` → `bg-blue-50 text-blue-700`
Inactive item: `text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200` → `text-gray-600 hover:bg-gray-50 hover:text-gray-900`

Mobile tabs: `bg-zinc-900 border-zinc-800` → `bg-gray-100 border-gray-200`
Active mobile tab: `bg-zinc-700 text-zinc-100` → `bg-white text-gray-900 shadow-sm`
Inactive mobile tab: `text-zinc-400 hover:text-zinc-200` → `text-gray-500 hover:text-gray-700`

Section heading border: `border-zinc-800` → `border-gray-200`
Section title: `text-zinc-100` → `text-gray-900`
Section subtitle: `text-zinc-400` → `text-gray-500`

---

### Task 11: TenantSettingsForm

**File:** `components/dashboard/TenantSettingsForm.tsx`

Row border: `border-zinc-800/70` → `border-gray-200`
Label: `text-zinc-200` → `text-gray-800`
Hint: `text-zinc-500` → `text-gray-500`
SectionLabel: `text-zinc-500` → `text-gray-400`

inp class:
```
"w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-colors"
```

Error: `text-red-400` → `text-red-600`
Saved: `text-green-400` → `text-emerald-600`
Save btn: `bg-zinc-100 text-zinc-900 hover:bg-zinc-200` → `bg-blue-600 text-white hover:bg-blue-700 rounded`

---

### Task 12: BrandAssetsSection

**File:** `components/dashboard/BrandAssetsSection.tsx`

Same Row/SectionLabel/inp token replacements as TenantSettingsForm.
Select element: dark → `border-gray-300 bg-white text-gray-900 focus:border-blue-500`
Add social link: `text-zinc-400 hover:text-zinc-200` → `text-blue-600 hover:text-blue-700`
Remove icon btn: `text-zinc-500 hover:bg-zinc-800 hover:text-red-400` → `text-gray-400 hover:bg-gray-100 hover:text-red-500`
Saved: `text-green-400` → `text-emerald-600`
Save btn: `bg-zinc-100 text-zinc-900 hover:bg-zinc-200` → `bg-blue-600 text-white hover:bg-blue-700 rounded`
Loading text: `text-zinc-500` → `text-gray-400`

---

### Task 13: Public estimate page + SignaturePanel

**Files:**
- `app/e/[id]/page.tsx`
- `app/e/[id]/SignaturePanel.tsx`

**page.tsx:**
Page bg: `bg-zinc-950` → `bg-gray-50`
Header company name: `text-zinc-400` → `text-gray-500`
Header title: `text-zinc-100` → `text-gray-900`
Header job: `text-zinc-400` → `text-gray-500`
Document card: `border-zinc-200 bg-white shadow-xl` → keep (already white)
Already signed banner: `border-green-500/30 bg-green-500/5` → `border-emerald-200 bg-emerald-50`
Signed text: `text-green-400` → `text-emerald-700`
Signed sub: `text-zinc-500` → `text-gray-500`
Declined banner: `border-rose-500/30 bg-rose-500/5` → `border-red-200 bg-red-50`
Declined text: `text-rose-400` → `text-red-700`
Footer text: `text-zinc-600` → `text-gray-400`

**SignaturePanel.tsx:**
Panel: `border-zinc-700 bg-zinc-900` → `border-gray-200 bg-white shadow-sm`
Title: `text-zinc-100` → `text-gray-900`
Subtitle: `text-zinc-400` → `text-gray-500`
Sig label: `text-zinc-400` → `text-gray-600`
Clear btn: `text-zinc-500 hover:text-zinc-300` → `text-gray-400 hover:text-gray-600`
Canvas border: `border-zinc-600` → `border-gray-200`
Name label: `text-zinc-400` → `text-gray-600`
Name input: `border-zinc-700 bg-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500` → `border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none`
Error: `text-red-400` → `text-red-600`
Sign btn: `bg-zinc-100 text-zinc-900 hover:bg-zinc-200` → `bg-blue-600 text-white hover:bg-blue-700 rounded`
Legal text: `text-zinc-500` → `text-gray-400`
Decline divider: `border-zinc-800` → `border-gray-100`
Decline link: `text-zinc-600 hover:text-zinc-400` → `text-gray-400 hover:text-gray-600`
Decline question: `text-zinc-400` → `text-gray-600`
Decline cancel: `border-zinc-700 text-zinc-300 hover:bg-zinc-800` → `border-gray-200 text-gray-600 hover:bg-gray-50 rounded`
Decline yes: `border-rose-700/50 bg-rose-600/10 text-rose-300 hover:bg-rose-600/20` → `border-red-200 bg-red-50 text-red-700 hover:bg-red-100 rounded`

Done state: `border-green-500/30 bg-green-500/5` → `border-emerald-200 bg-emerald-50`
Done icon/title: `text-green-400 / text-zinc-100` → `text-emerald-600 / text-gray-900`
Done text: `text-zinc-400 / text-zinc-200` → `text-gray-500 / text-gray-700`
Declined state: `border-rose-500/30 bg-rose-500/5` → `border-red-200 bg-red-50`
Declined title: `text-rose-300` → `text-red-700`
Declined text: `text-zinc-400` → `text-gray-500`

All `rounded-xl / rounded-lg` → `rounded`

---

### Final: Commit all

```bash
git add -A
git commit -m "style: HouseCall Pro light theme redesign — white surfaces, Inter, angular corners, light status chips"
```
