/**
 * Formats a number as currency
 * @param value Number to format
 * @param currency Currency symbol
 * @param decimals Number of decimal places
 */
export const formatCurrency = (
  value: number | string,
  currency = "$",
  decimals = 2
): string => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) return `${currency}0.00`;

  // For very large numbers, use compact notation
  if (numValue >= 1e9) {
    return `${currency}${(numValue / 1e9).toFixed(2)}B`;
  }

  if (numValue >= 1e6) {
    return `${currency}${(numValue / 1e6).toFixed(2)}M`;
  }

  if (numValue >= 1e3) {
    return `${currency}${(numValue / 1e3).toFixed(2)}K`;
  }

  return `${currency}${numValue.toFixed(decimals)}`;
};

/**
 * Formats a number as percentage
 * @param value Number to format (e.g. 0.1234 for 12.34%)
 * @param decimals Number of decimal places
 * @param includeSign Whether to include the % sign
 */
export const formatPercentage = (
  value: number | string,
  decimals = 2,
  includeSign = true
): string => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) return `0${includeSign ? "%" : ""}`;

  // Convert to percentage (multiply by 100)
  const percentage = numValue * 100;

  return `${percentage.toFixed(decimals)}${includeSign ? "%" : ""}`;
};

/**
 * Formats a token balance with appropriate precision
 * @param value Balance to format
 * @param decimals Number of decimal places
 */
export const formatBalance = (value: string | number, decimals = 4): string => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) return "0";

  // For very large numbers, use compact notation
  if (numValue >= 1e9) {
    return `${(numValue / 1e9).toFixed(2)}B`;
  }

  if (numValue >= 1e6) {
    return `${(numValue / 1e6).toFixed(2)}M`;
  }

  if (numValue >= 1e3) {
    return `${(numValue / 1e3).toFixed(2)}K`;
  }

  // For small numbers, show more precision
  if (numValue > 0 && numValue < 0.001) {
    return "<0.001";
  }

  return numValue.toFixed(decimals);
};

/**
 * Formats a token amount considering its decimals
 * @param amount Token amount in base units (e.g. wei)
 * @param tokenDecimals The token's decimal places
 * @param displayDecimals How many decimals to display
 */
export const formatTokenAmount = (
  amount: string | number,
  tokenDecimals = 9,
  displayDecimals = 4
): string => {
  if (!amount) return "0";

  const numAmount = typeof amount === "string" ? Number(amount) : amount;

  if (isNaN(numAmount)) return "0";

  // Convert from base units to display units
  const displayAmount = numAmount / Math.pow(10, tokenDecimals);

  // Format with appropriate precision
  return formatBalance(displayAmount, displayDecimals);
};

/**
 * Parses a user input string into a number, handling invalid input
 * @param value User input to parse
 * @param fallback Value to return if parsing fails
 */
export const parseInputValue = (value: string, fallback = 0): number => {
  if (!value || value === "") return fallback;

  const parsed = parseFloat(value);

  return isNaN(parsed) ? fallback : parsed;
};
