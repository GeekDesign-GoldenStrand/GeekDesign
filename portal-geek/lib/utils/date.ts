export function formatDate(dateString: string) {
  const date = new Date(dateString);

  const day = String(date.getUTCDate()).padStart(2, "0");
  const year = date.getUTCFullYear();

  const months = [
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
  const month = months[date.getUTCMonth()];

  return `${day} ${month} ${year}`;
}

export function daysUntilDate(dateString: string): "soon" | "very soon" | "expired" | "n/a" {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const target = new Date(dateString);
  target.setUTCHours(0, 0, 0, 0);

  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return "expired";
  else if (diff <= 5) return "very soon";
  else if (diff <= 10 && diff > 5) "soon";
  else return "n/a";
}