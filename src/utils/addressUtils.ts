/**
 * Truncates a Sui address for display purposes
 * @param address The full address
 * @param startChars Number of characters to show at the start
 * @param endChars Number of characters to show at the end
 * @returns Truncated address with ellipsis
 */
export const truncateAddress = (
  address: string,
  startChars = 4,
  endChars = 4
): string => {
  if (!address) return "";

  if (address.length <= startChars + endChars) {
    return address;
  }

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Validates if a string is a valid Sui address
 * @param address The string to validate
 * @returns Boolean indicating if the string is a valid Sui address
 */
export const isValidSuiAddress = (address: string): boolean => {
  // Basic validation: Sui addresses are 64 hex chars possibly prefixed with 0x
  if (!address) return false;

  // Remove 0x prefix if present
  const cleanAddress = address.startsWith("0x") ? address.slice(2) : address;

  return /^[0-9a-fA-F]{64}$/.test(cleanAddress);
};

/**
 * Ensures an address has the 0x prefix
 * @param address The address to normalize
 * @returns Address with 0x prefix
 */
export const normalizeAddress = (address: string): string => {
  if (!address) return "";

  if (!address.startsWith("0x")) {
    return `0x${address}`;
  }

  return address;
};
