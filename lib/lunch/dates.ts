const pragueDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Prague",
});

export function getLunchDate(): string {
  return pragueDate.format(new Date());
}

export function getLunchWeekStart(date = getLunchDate()): string {
  const monday = new Date(`${date}T00:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}
