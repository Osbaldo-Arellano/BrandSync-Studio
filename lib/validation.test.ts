import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  validateLineItems,
  INVOICE_TRANSITIONS,
  PAYABLE_STATUSES,
} from "./validation";

describe("isValidEmail", () => {
  it("accepts standard email", () => expect(isValidEmail("user@example.com")).toBe(true));
  it("accepts email with plus", () => expect(isValidEmail("a+b@sub.domain.io")).toBe(true));
  it("rejects empty string", () => expect(isValidEmail("")).toBe(false));
  it("rejects no @", () => expect(isValidEmail("noatsign.com")).toBe(false));
  it("rejects no domain", () => expect(isValidEmail("user@")).toBe(false));
  it("rejects no local part", () => expect(isValidEmail("@domain.com")).toBe(false));
  it("rejects plain word", () => expect(isValidEmail("notanemail")).toBe(false));
  it("trims before testing", () => expect(isValidEmail("  user@example.com  ")).toBe(true));
});

describe("validateLineItems", () => {
  const good = { description: "Labor", quantity: 2, unit_price: 50, line_total: 100 };

  it("passes valid single item", () => expect(validateLineItems([good])).toHaveLength(0));
  it("passes free item (price = 0)", () => {
    expect(validateLineItems([{ ...good, unit_price: 0 }])).toHaveLength(0);
  });
  it("rejects empty array", () => {
    const e = validateLineItems([]);
    expect(e).toHaveLength(1);
    expect(e[0].field).toBe("items");
  });
  it("rejects non-array", () => {
    // @ts-expect-error intentional
    expect(validateLineItems(null)).toHaveLength(1);
  });
  it("rejects > 100 items", () => {
    const many = Array(101).fill(good);
    expect(validateLineItems(many)[0].field).toBe("items");
  });
  it("rejects empty description", () => {
    const e = validateLineItems([{ ...good, description: "" }]);
    expect(e.some(x => x.field.includes("description"))).toBe(true);
  });
  it("rejects whitespace-only description", () => {
    const e = validateLineItems([{ ...good, description: "   " }]);
    expect(e.some(x => x.field.includes("description"))).toBe(true);
  });
  it("rejects description > 500 chars", () => {
    const e = validateLineItems([{ ...good, description: "x".repeat(501) }]);
    expect(e.some(x => x.field.includes("description"))).toBe(true);
  });
  it("rejects zero quantity", () => {
    const e = validateLineItems([{ ...good, quantity: 0 }]);
    expect(e.some(x => x.field.includes("quantity"))).toBe(true);
  });
  it("rejects negative quantity", () => {
    const e = validateLineItems([{ ...good, quantity: -1 }]);
    expect(e.some(x => x.field.includes("quantity"))).toBe(true);
  });
  it("rejects NaN quantity", () => {
    const e = validateLineItems([{ ...good, quantity: NaN }]);
    expect(e.some(x => x.field.includes("quantity"))).toBe(true);
  });
  it("rejects negative unit_price", () => {
    const e = validateLineItems([{ ...good, unit_price: -0.01 }]);
    expect(e.some(x => x.field.includes("unit_price"))).toBe(true);
  });
  it("accumulates errors across multiple items", () => {
    const bad = [
      { description: "", quantity: 0, unit_price: -1 },
      { description: "ok", quantity: 1, unit_price: 5 },
    ];
    const e = validateLineItems(bad);
    expect(e.length).toBeGreaterThanOrEqual(3); // desc + qty + price for item 0
  });
});

describe("INVOICE_TRANSITIONS state machine", () => {
  it("draft → sent, void only", () => {
    expect(INVOICE_TRANSITIONS.draft).toEqual(expect.arrayContaining(["sent", "void"]));
    expect(INVOICE_TRANSITIONS.draft).not.toContain("paid");
    expect(INVOICE_TRANSITIONS.draft).not.toContain("overdue");
  });
  it("sent → all payable states + void", () => {
    const s = INVOICE_TRANSITIONS.sent;
    ["paid", "overdue", "partial", "cash", "cashapp", "deferred", "void"].forEach(x =>
      expect(s).toContain(x)
    );
    expect(s).not.toContain("draft");
  });
  it("paid is terminal", () => expect(INVOICE_TRANSITIONS.paid).toHaveLength(0));
  it("void is terminal", () => expect(INVOICE_TRANSITIONS.void).toHaveLength(0));
  it("partial can return to sent", () => expect(INVOICE_TRANSITIONS.partial).toContain("sent"));
  it("overdue can become paid or void", () => {
    expect(INVOICE_TRANSITIONS.overdue).toContain("paid");
    expect(INVOICE_TRANSITIONS.overdue).toContain("void");
    expect(INVOICE_TRANSITIONS.overdue).not.toContain("draft");
  });
  it("cashapp → paid only", () => {
    expect(INVOICE_TRANSITIONS.cashapp).toEqual(["paid"]);
  });
  it("cash → paid only", () => {
    expect(INVOICE_TRANSITIONS.cash).toEqual(["paid"]);
  });
  it("deferred → sent, paid, or overdue", () => {
    ["sent", "paid", "overdue"].forEach(x =>
      expect(INVOICE_TRANSITIONS.deferred).toContain(x)
    );
  });
});

describe("PAYABLE_STATUSES", () => {
  it("includes payable statuses", () => {
    ["sent", "draft", "partial", "overdue", "deferred"].forEach(s =>
      expect(PAYABLE_STATUSES.has(s)).toBe(true)
    );
  });
  it("excludes terminal statuses", () => {
    ["paid", "void", "cash", "cashapp"].forEach(s =>
      expect(PAYABLE_STATUSES.has(s)).toBe(false)
    );
  });
});
