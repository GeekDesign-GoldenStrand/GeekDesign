/**
 * Formats a 10-digit phone number string into "xxx xxx xxxx" format.
 * If the input is not 10 digits, it returns the input as is or partially formatted.
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";

  // Remove non-numeric characters
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  // For incomplete numbers, still try to add spaces
  if (digits.length > 6) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  } else if (digits.length > 3) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  }

  return digits;
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
