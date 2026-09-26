export function sanitizePhoneInput(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export function normalizePhoneForApi(value: string) {
  const cleaned = sanitizePhoneInput(value.trim());

  if (!cleaned) {
    return "";
  }

  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  if (cleaned.startsWith("225")) {
    return `+${cleaned}`;
  }

  if (cleaned.startsWith("0")) {
    return `+225${cleaned}`;
  }

  return cleaned;
}

export function isValidPhone(value: string) {
  return /^\+?[0-9]{8,15}$/.test(value);
}
