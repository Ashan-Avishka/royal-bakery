import { describe, expect, it } from "vitest";
import { buildQuery } from "./queryString";

describe("buildQuery", () => {
  it("returns an empty string when there are no values", () => {
    expect(buildQuery({})).toBe("");
    expect(buildQuery({ a: undefined, b: "" })).toBe("");
  });

  it("serializes present values in insertion order", () => {
    expect(buildQuery({ status: "pending", selected: "abc-123" })).toBe(
      "?status=pending&selected=abc-123"
    );
  });

  it("skips undefined or empty values while keeping the rest", () => {
    expect(buildQuery({ status: undefined, selected: "abc-123" })).toBe(
      "?selected=abc-123"
    );
  });
});
