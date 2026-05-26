export function normalizePhoneInput(value: string): string {
  return value.replace(/[^\d+()\-\s]/g, '').trim();
}

export function isValidPhoneNumber(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}
