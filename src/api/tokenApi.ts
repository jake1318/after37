import axios from "axios";
import { Coin } from "../types/api";

// Base URL for API calls
const BASE_URL = "/api";

/**
 * Get supported tokens (partial list for UI performance)
 */
export const getSupportedTokens = async (): Promise<string[]> => {
  const response = await axios.get(`${BASE_URL}/supported-tokens`);
  return response.data;
};

/**
 * Search for tokens by query
 */
export const searchTokens = async (query: string): Promise<string[]> => {
  if (!query.trim()) return [];

  const response = await axios.get(
    `${BASE_URL}/search-tokens?query=${encodeURIComponent(query)}`
  );
  return response.data;
};

/**
 * Convert token address to token object
 */
export const addressToToken = (address: string): Coin => {
  const symbol = address.split("::").pop() || "UNKNOWN";
  return {
    type: address,
    symbol,
    name: symbol,
    decimals: 9,
    price: 0,
  };
};

export default {
  getSupportedTokens,
  searchTokens,
  addressToToken,
};
