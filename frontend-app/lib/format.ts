const UNKNOWN = "inconnu";

export function displayValue(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return UNKNOWN;
  }
  return value;
}

export function isUnknown(value: string | null | undefined): boolean {
  return displayValue(value) === UNKNOWN;
}
