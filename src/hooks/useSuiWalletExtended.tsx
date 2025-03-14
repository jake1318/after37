import { useWallet } from "@suiet/wallet-kit";
import { SuiTransactionBlockResponse } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useState, useEffect } from "react";
import { suiClient } from "../main";

// Interface for wallet balance data
export interface TokenBalance {
  type: string;
  symbol: string;
  balance: string;
  decimals: number;
  formattedBalance: string;
}

// Export both function names for backward compatibility
export function useSuietWalletExtended() {
  return useSuiWallet();
}

// Using the same function name as before for compatibility
export function useSuiWallet() {
  const suietWallet = useWallet();
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastTxId, setLastTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletBalances, setWalletBalances] = useState<TokenBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  const connected = suietWallet.connected && !!suietWallet.account;
  const address = suietWallet.account?.address;

  // Fetch wallet balances when the account changes
  useEffect(() => {
    const fetchBalances = async () => {
      if (!address) {
        setWalletBalances([]);
        return;
      }

      setIsLoadingBalances(true);
      console.log("Fetching balances for address:", address);

      try {
        // Get all coins owned by the user
        const allCoins = await suiClient.getAllCoins({
          owner: address,
        });

        console.log("Received coins:", allCoins);

        // Process the coins into a more usable format with proper grouping by type
        const balanceMap: Record<string, TokenBalance> = {};

        for (const coin of allCoins.data) {
          if (!coin.coinType || !coin.balance) continue;

          const coinType = coin.coinType;
          const balance = coin.balance;
          const decimals = getTokenDecimals(coinType);
          const symbol = extractSymbol(coinType);

          // If this coin type already exists in our map, add to its balance
          if (balanceMap[coinType]) {
            const existingBalance = BigInt(balanceMap[coinType].balance);
            const additionalBalance = BigInt(balance);
            const newBalance = existingBalance + additionalBalance;
            balanceMap[coinType].balance = newBalance.toString();
            balanceMap[coinType].formattedBalance = formatBalance(
              newBalance.toString(),
              decimals
            );
          } else {
            // Otherwise create a new entry
            balanceMap[coinType] = {
              type: coinType,
              symbol,
              balance: balance,
              decimals,
              formattedBalance: formatBalance(balance, decimals),
            };
          }
        }

        // Convert the map to an array and sort by balance (highest first)
        const balances = Object.values(balanceMap).sort((a, b) => {
          return Number(b.balance) - Number(a.balance);
        });

        console.log("Processed balances:", balances);
        setWalletBalances(balances);
      } catch (err: any) {
        console.error("Failed to load wallet balances:", err);
        setError("Failed to load wallet balances");
      } finally {
        setIsLoadingBalances(false);
      }
    };

    if (connected) {
      console.log("Connected! Fetching balances...");
      fetchBalances();

      // Refresh balances periodically
      const intervalId = setInterval(fetchBalances, 30000);
      return () => clearInterval(intervalId);
    } else {
      console.log("Not connected, no balances to fetch");
      setWalletBalances([]);
    }
  }, [connected, address]);

  // Add a specific useEffect to listen for Suiet wallet account changes
  useEffect(() => {
    if (!suietWallet || !suietWallet.on) return;

    // Listen for account changes from the wallet
    const unsubscribe = suietWallet.on("accountChange", (params) => {
      console.log("Account changed in wallet:", params);
      // Force refresh balances when account changes
      if (params.account && params.account.address) {
        console.log("Account changed, refreshing balances...");
        // Wait a bit to ensure the change has propagated
        setTimeout(() => {
          if (suietWallet.connected && suietWallet.account) {
            console.log("Refreshing balances after account change");
            fetchBalances(suietWallet.account.address);
          }
        }, 500);
      }
    });

    return unsubscribe;
  }, [suietWallet]);

  // Separate function to fetch balances for a specific address
  const fetchBalances = async (specificAddress?: string) => {
    const targetAddress = specificAddress || address;
    if (!targetAddress) {
      setWalletBalances([]);
      return;
    }

    setIsLoadingBalances(true);
    console.log("Fetching balances for address:", targetAddress);

    try {
      // Get all coins owned by the user
      const allCoins = await suiClient.getAllCoins({
        owner: targetAddress,
      });

      console.log("Received coins:", allCoins);

      // Process the coins into a more usable format with proper grouping by type
      const balanceMap: Record<string, TokenBalance> = {};

      for (const coin of allCoins.data) {
        if (!coin.coinType || !coin.balance) continue;

        const coinType = coin.coinType;
        const balance = coin.balance;
        const decimals = getTokenDecimals(coinType);
        const symbol = extractSymbol(coinType);

        // If this coin type already exists in our map, add to its balance
        if (balanceMap[coinType]) {
          const existingBalance = BigInt(balanceMap[coinType].balance);
          const additionalBalance = BigInt(balance);
          const newBalance = existingBalance + additionalBalance;
          balanceMap[coinType].balance = newBalance.toString();
          balanceMap[coinType].formattedBalance = formatBalance(
            newBalance.toString(),
            decimals
          );
        } else {
          // Otherwise create a new entry
          balanceMap[coinType] = {
            type: coinType,
            symbol,
            balance: balance,
            decimals,
            formattedBalance: formatBalance(balance, decimals),
          };
        }
      }

      // Convert the map to an array and sort by balance (highest first)
      const balances = Object.values(balanceMap).sort((a, b) => {
        return Number(b.balance) - Number(a.balance);
      });

      console.log("Processed balances:", balances);
      setWalletBalances(balances);
    } catch (err: any) {
      console.error("Failed to load wallet balances:", err);
      setError("Failed to load wallet balances");
    } finally {
      setIsLoadingBalances(false);
    }
  };

  // Helper functions for token management
  const getTokenDecimals = (coinType: string): number => {
    // Default decimals
    if (coinType === "0x2::sui::SUI") return 9;

    // Common stablecoins typically have 6 decimals
    if (coinType.includes("USDC") || coinType.includes("USDT")) return 6;

    // BTC and ETH wrapped tokens typically have 8 decimals
    if (coinType.includes("BTC") || coinType.includes("ETH")) return 8;

    // Default to 9 for other tokens
    return 9;
  };

  // Extract symbol from coin type
  const extractSymbol = (coinType: string): string => {
    try {
      // Try to extract the symbol from the coin type
      const parts = coinType.split("::");
      if (parts.length >= 3) {
        return parts[2];
      }
      return coinType.split("::").pop() || "UNKNOWN";
    } catch {
      return "UNKNOWN";
    }
  };

  // Format balance for display
  const formatBalance = (balance: string, decimals: number): string => {
    try {
      const value = Number(BigInt(balance) / BigInt(10 ** decimals));
      return value.toFixed(value < 0.01 ? 4 : 2);
    } catch (error) {
      console.error("Error formatting token balance:", error);
      return "0";
    }
  };

  // Get balance for a specific token
  const getTokenBalance = (tokenType: string): TokenBalance | undefined => {
    if (!tokenType) return undefined;
    return walletBalances.find((balance) => balance.type === tokenType);
  };

  // Execute transaction with Suiet wallet
  const executeTransaction = async (
    transactionBlock: TransactionBlock
  ): Promise<SuiTransactionBlockResponse | undefined> => {
    if (!connected || !address) {
      setError("Wallet not connected");
      return undefined;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const result = await suietWallet.signAndExecuteTransactionBlock({
        transactionBlock,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      setLastTxId(result.digest);

      // Refresh balances after a successful transaction
      setTimeout(() => {
        if (connected && address) {
          fetchBalances(address);
        }
      }, 2000); // Wait 2 seconds after transaction to refresh balances

      return result;
    } catch (e: any) {
      console.error("Transaction execution failed:", e);
      setError(e.message || "Transaction execution failed");
      return undefined;
    } finally {
      setIsExecuting(false);
    }
  };

  // Manual refresh function that components can call
  const refreshBalances = () => {
    if (connected && address) {
      fetchBalances(address);
    }
  };

  return {
    connected,
    address,
    suietWallet,
    executeTransaction,
    isExecuting,
    lastTxId,
    error,
    clearError: () => setError(null),
    walletBalances,
    isLoadingBalances,
    getTokenBalance,
    refreshBalances,
    // Add these for backwards compatibility with old hook
    account: suietWallet.account,
    client: suiClient,
    provider: suiClient,
    suiClient,
  };
}
