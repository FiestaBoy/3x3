export const AgeGroups = ["U12", "U14", "U16", "Adult"] as const;
export type AgeGroup = (typeof AgeGroups)[number];

function subtractYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() - years);
  return result;
}

export function getAgeGroupMinBirthdays(): Record<AgeGroup, Date> {
  const now = new Date();
  return {
    U12: subtractYears(now, 12),
    U14: subtractYears(now, 14),
    U16: subtractYears(now, 16),
    Adult: new Date("1900-01-01"),
  };
}
