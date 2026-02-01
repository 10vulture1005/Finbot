export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat("en-IN").format(value);
