import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useWallet as useSuietWallet } from "@suiet/wallet-kit";
import { useState, useEffect } from "react";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiTransactionBlockResponse } from "@mysten/sui.js/client";

// Define interface for token balances similar to what you already have
export interface TokenBalance {
  type: string;
  symbol: string;
  balance: string;
  decimals: number;
  formattedBalance: string;
}

export function useCombinedWallet() {
  // Get wallet states from both providers
  const dappKitAccount = useCurrentAccount();
  const suietWallet = useSuietWallet();
  const suiClient = useSuiClient();

  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [walletBalances, setWalletBalances] = useState<TokenBalance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Determine if any wallet is connected
  const isDappKitConnected = !!dappKitAccount;
  const isSuietConnected = suietWallet.connected && !!suietWallet.account;

  // Get the active address from either wallet
  const address = isDappKitConnected
    ? dappKitAccount.address
    : isSuietConnected
    ? suietWallet.account?.address
    : null;

  // Combined connection status
  const isConnected = isDappKitConnected || isSuietConnected;

  // Fetch balances when an account is connected
  useEffect(() => {
    const fetchBalances = async () => {
      if (!address || !suiClient) {
        setWalletBalances([]);
        return;
      }

      setIsLoadingBalances(true);

      try {
        // Get all coins owned by the user
        const allCoins = await suiClient.getAllCoins({
          owner: address,
        });

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

        setWalletBalances(balances);
      } catch (err: any) {
        console.error("Failed to load wallet balances:", err);
        setError("Failed to load wallet balances");
      } finally {
        setIsLoadingBalances(false);
      }
    };

    if (isConnected) {
      fetchBalances();

      // Refresh balances periodically
      const intervalId = setInterval(fetchBalances, 30000);
      return () => clearInterval(intervalId);
    }
  }, [address, suiClient, isConnected]);

  // Helper function to determine token decimals based on type
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

  // Helper function to format balance
  const formatBalance = (balance: string, decimals: number): string => {
    try {
      const value = Number(BigInt(balance) / BigInt(10 ** decimals));
      return value.toFixed(value < 0.01 ? 4 : 2);
    } catch (error) {
      console.error("Error formatting token balance:", error);
      return "0";
    }
  };

  // Execute transaction with the appropriate wallet
  const executeTransaction = async (
    transactionBlock: TransactionBlock
  ): Promise<SuiTransactionBlockResponse | undefined> => {
    if (!isConnected) {
      setError("Wallet not connected");
      return undefined;
    }

    try {
      setIsExecuting(true);
      setError(null);

      let response: SuiTransactionBlockResponse | undefined;

      // Use the appropriate wallet to execute the transaction
      if (isDappKitConnected) {
        // For dapp-kit wallet
        response = await suiClient.executeTransactionBlock({
          transactionBlock,
          options: {
            showEffects: true,
            showEvents: true,
          },
        });
      } else if (isSuietConnected) {
        // For Suiet wallet
        const signedTx = await suietWallet.signAndExecuteTransactionBlock({
          transactionBlock,
        });
        response = signedTx;
      }

      return response;
    } catch (err: any) {
      console.error("Transaction execution failed:", err);
      setError(err.message || "Transaction failed");
      return undefined;
    } finally {
      setIsExecuting(false);
    }
  };

  // Get balance for a specific token
  const getTokenBalance = (tokenType: string): TokenBalance | undefined => {
    if (!tokenType) return undefined;
    return walletBalances.find((balance) => balance.type === tokenType);
  };

  // Disconnect from the active wallet
  const disconnect = async () => {
    try {
      if (isSuietConnected) {
        await suietWallet.disconnect();
      }
      // Note: dapp-kit doesn't seem to have a direct disconnect method
      // We'd need to add that when it becomes available
    } catch (err) {
      console.error("Error disconnecting wallet:", err);
    }
  };

  return {
    // General wallet state
    address,
    isConnected,
    isExecuting,
    error,

    // Balance information
    walletBalances,
    isLoadingBalances,
    getTokenBalance,

    // Transaction handling
    executeTransaction,

    // Wallet management
    disconnect,

    // Raw wallet access (for advanced usage)
    dappKitAccount,
    suietWallet,
    suiClient,
  };
}
