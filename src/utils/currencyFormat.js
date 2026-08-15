/** Whole rupee amounts for revenue reports and summaries (no decimals). */
export const roundCurrency = (value) => Math.round(Number(value) || 0)

export const formatRupeeRounded = (value) =>
  `₹${roundCurrency(value).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`
