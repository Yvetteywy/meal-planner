"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * A typed hook that persists state to localStorage.
 * Falls back gracefully when localStorage is unavailable (SSR, private mode).
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next =
          typeof value === "function"
            ? (value as (prev: T) => T)(prev)
            : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Quota exceeded or private mode — silently ignore
        }
        return next;
      });
    },
    [key]
  );

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch {
          // ignore malformed values
        }
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [key]);

  return [storedValue, setValue];
}
