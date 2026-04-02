import { describe, it, expect } from "vitest";
import { renderTemplate } from "./render-template";

describe("renderTemplate", () => {
  it("substitutes a single token", () => {
    expect(renderTemplate("<p>{{name}}</p>", { name: "Alice" }))
      .toBe("<p>Alice</p>");
  });

  it("substitutes multiple different tokens", () => {
    expect(
      renderTemplate("{{greeting}}, {{name}}!", { greeting: "Hello", name: "Bob" })
    ).toBe("Hello, Bob!");
  });

  it("substitutes the same token appearing multiple times", () => {
    expect(renderTemplate("{{x}} and {{x}}", { x: "foo" })).toBe("foo and foo");
  });

  it("replaces unknown tokens with empty string", () => {
    expect(renderTemplate("{{missing}}", {})).toBe("");
  });

  it("returns the string unchanged when there are no tokens", () => {
    expect(renderTemplate("<p>static</p>", {})).toBe("<p>static</p>");
  });

  it("handles empty html_body", () => {
    expect(renderTemplate("", { name: "test" })).toBe("");
  });
});
