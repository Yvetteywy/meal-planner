/**
 * Date utility functions for the meal plan calendar.
 */

/** Returns the Monday of the week containing the given date. */
export function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // 0 = Sunday → go back 6; 1 = Monday → 0; etc.
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns an array of 7 Date objects starting from the given Monday. */
export function getWeekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}
