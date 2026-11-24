"use client";

import { useTranslations } from "next-intl";
import type { Unit } from "./types";

/**
 * Hook that returns a function to get the localized label for a unit.
 * Centralizes unit translation so pages don't need to import tUnits individually.
 *
 * Usage:
 *   const { getUnitLabel, UNITS } = useUnits();
 *   <span>{getUnitLabel("piece")}</span>  // → "个" in Chinese
 */
export function useUnits() {
  const tUnits = useTranslations("units");

  const UNITS: Unit[] = [
    "g", "kg", "ml", "l", "tsp", "tbsp", "cup", "oz", "lb",
    "qt", "gal", "piece", "unit", "pack", "box", "bag",
  ];

  function getUnitLabel(unit: string): string {
    try {
      return tUnits(unit as Unit);
    } catch {
      return unit; // fallback to raw value if key not found
    }
  }

  return { getUnitLabel, UNITS };
}
