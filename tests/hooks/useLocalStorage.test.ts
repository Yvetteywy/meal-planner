import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns the initial value when localStorage is empty", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", 42));
    expect(result.current[0]).toBe(42);
  });

  it("returns the stored value when localStorage has data", () => {
    localStorage.setItem("test-key", JSON.stringify("hello"));
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    expect(result.current[0]).toBe("hello");
  });

  it("persists updates to localStorage", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", 0));
    act(() => {
      result.current[1](99);
    });
    expect(result.current[0]).toBe(99);
    expect(JSON.parse(localStorage.getItem("test-key")!)).toBe(99);
  });

  it("supports updater function", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", 10));
    act(() => {
      result.current[1]((prev) => prev + 5);
    });
    expect(result.current[0]).toBe(15);
  });

  it("works with complex objects", () => {
    const initial = { items: [{ name: "apple", qty: 3 }] };
    const { result } = renderHook(() => useLocalStorage("test-key", initial));
    expect(result.current[0]).toEqual(initial);

    const updated = { items: [{ name: "apple", qty: 5 }, { name: "banana", qty: 2 }] };
    act(() => {
      result.current[1](updated);
    });
    expect(result.current[0]).toEqual(updated);
  });

  it("returns initial value when localStorage contains invalid JSON", () => {
    localStorage.setItem("test-key", "not-valid-json");
    const { result } = renderHook(() => useLocalStorage("test-key", "fallback"));
    expect(result.current[0]).toBe("fallback");
  });
});
