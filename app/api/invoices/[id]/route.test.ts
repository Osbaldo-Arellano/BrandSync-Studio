import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { PATCH, DELETE } from "./route";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function makeRequest(body: unknown, method = "PATCH") {
  return new Request("http://localhost/api/invoices/test-id", {
    method,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeParams(id = "test-id") {
  return { params: Promise.resolve({ id }) };
}

function makeMockSupabase(overrides: Record<string, unknown> = {}) {
  const mockChain = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    ...overrides,
  };
  return mockChain;
}

describe("PATCH /api/invoices/[id]", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 401 when not authenticated", async () => {
    const mockSb = makeMockSupabase();
    mockSb.from.mockImplementation((table: string) => {
      if (table === "invoices") return mockSb;
      return mockSb;
    });
    (mockSb as unknown as { auth: { getUser: () => Promise<{ data: { user: null } }> } }).auth = { getUser: async () => ({ data: { user: null } }) };
    (createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null } }) },
    });

    const res = await PATCH(makeRequest({ status: "sent" }), makeParams());
    expect(res.status).toBe(401);
  });

  it("returns 404 when invoice not found", async () => {
    (createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }),
    });

    const res = await PATCH(makeRequest({ status: "sent" }), makeParams());
    expect(res.status).toBe(404);
  });

  it("rejects invalid status transition (draft -> paid)", async () => {
    (createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { status: "draft", total: 100, amount_paid: 0 } }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: {}, error: null }),
              }),
            }),
          }),
        }),
      }),
    });

    const res = await PATCH(makeRequest({ status: "paid" }), makeParams());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Cannot transition");
  });

  it("allows valid transition (draft -> sent)", async () => {
    const updatedInvoice = { id: "test-id", status: "sent" };
    (createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { status: "draft", total: 100, amount_paid: 0 } }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updatedInvoice, error: null }),
              }),
            }),
          }),
        }),
      }),
    });

    const res = await PATCH(makeRequest({ status: "sent" }), makeParams());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("sent");
  });

  it("syncs amount_paid to total when marking paid", async () => {
    let patchArg: Record<string, unknown> = {};
    const mockUpdate = vi.fn().mockImplementation((patch: Record<string, unknown>) => {
      patchArg = patch;
      return {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { ...patch }, error: null }),
            }),
          }),
        }),
      };
    });

    (createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { status: "sent", total: 200, amount_paid: 0 } }),
            }),
          }),
        }),
        update: mockUpdate,
      }),
    });

    await PATCH(makeRequest({ status: "paid" }), makeParams());
    expect(patchArg.amount_paid).toBe(200);
  });

  it("rejects terminal state transition (paid -> sent)", async () => {
    (createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { status: "paid", total: 100, amount_paid: 100 } }),
            }),
          }),
        }),
        update: vi.fn(),
      }),
    });

    const res = await PATCH(makeRequest({ status: "sent" }), makeParams());
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/invoices/[id]", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 401 when not authenticated", async () => {
    (createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null } }) },
    });
    const res = await DELETE(makeRequest({}, "DELETE"), makeParams());
    expect(res.status).toBe(401);
  });

  it("returns 404 when invoice not found", async () => {
    (createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }),
    });

    const res = await DELETE(makeRequest({}, "DELETE"), makeParams());
    expect(res.status).toBe(404);
  });

  it("rejects deletion of non-draft invoice", async () => {
    (createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { status: "sent" } }),
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }),
    });

    const res = await DELETE(makeRequest({}, "DELETE"), makeParams());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("draft");
  });

  it("successfully deletes a draft invoice", async () => {
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    (createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
      from: vi.fn().mockImplementation((table: string) => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { status: "draft" } }),
            }),
          }),
        }),
        delete: table === "invoice_items"
          ? vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
          : mockDelete,
      })),
    });

    const res = await DELETE(makeRequest({}, "DELETE"), makeParams());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});
