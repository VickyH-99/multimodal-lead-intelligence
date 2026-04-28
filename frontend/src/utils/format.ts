export function formatPercent(value: number | null | undefined): string {
  if (value == null) {
    return "N/A";
  }
  return `${(value * 100).toFixed(0)}%`;
}

export function formatScore(value: number | null | undefined): string {
  if (value == null) {
    return "N/A";
  }
  return value.toFixed(2);
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) {
    return "N/A";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
