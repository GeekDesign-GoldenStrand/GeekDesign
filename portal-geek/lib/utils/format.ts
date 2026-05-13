/**
 * Formats a 10-digit phone number string into "xxx xxx xxxx" format.
 * If the input is not 10 digits, it returns the input as is or partially formatted.
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";

  const digits = phone.replace(/\D/g, "").slice(0, 10);

  const isMetro = /^(55|33|81)/.test(digits);
  if (isMetro) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2, 6)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3, 6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
}

/**
 * Extracts the 10-digit national number from raw phone input. When a number is
 * pasted with the Mexican country code (e.g. "+52 1 272 703 3148" from WhatsApp),
 * strips the leading 52 and optional mobile 1 prefix instead of truncating the
 * tail, which would silently corrupt the number.
 */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("52")) {
    digits = digits.slice(2);
    if (digits.length > 10 && digits.startsWith("1")) {
      digits = digits.slice(1);
    }
  }
  return digits.slice(0, 10);
}

/**
 * Formats a date timestamp string into "dd MMM yyyy" format.
 */
export function formatDate(dateString: string): string {
  const MONTHS = [
    "ENE",
    "FEB",
    "MAR",
    "ABR",
    "MAY",
    "JUN",
    "JUL",
    "AGO",
    "SEP",
    "OCT",
    "NOV",
    "DIC",
  ];

  const date = new Date(dateString);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  return `${day} ${month} ${year}`;
}
