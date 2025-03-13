import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransactionBlock,
} from "@mysten/dapp-kit";

import { SuiTransactionBlockResponse } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useState, useEffect } from "react";

// Interface for wallet balance data
export interface TokenBalance {
  type: string;
  symbol: string;
  balance: string;
  decimals: number;
  formattedBalance: string;
}

export function useSuiWallet() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastTxId, setLastTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletBalances, setWalletBalances] = useState<TokenBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  const { mutateAsync: signAndExecute } = useSignAndExecuteTransactionBlock();

  // Fetch wallet balances when the account changes
  useEffect(() => {
    const fetchBalances = async () => {
      if (!currentAccount?.address || !suiClient) {
        setWalletBalances([]);
        return;
      }

      setIsLoadingBalances(true);

      try {
        // Get all coins owned by the user
        const allCoins = await suiClient.getAllCoins({
          owner: currentAccount.address,
        });

        // Process the coins into a more usable format with proper grouping by type
        const balanceMap: Record<string, TokenBalance> = {};

        for (const coin of allCoins.data) {
          if (!coin.coinType || !coin.balance) continue;

          const coinType = coin.coinType;
          const balance = coin.balance;
          const decimals = 9; // Default decimals for SUI tokens
          const symbol = coinType.split("::").pop() || "UNKNOWN";

          // If this coin type already exists in our map, add to its balance
          if (balanceMap[coinType]) {
            const existingBalance = BigInt(balanceMap[coinType].balance);
            const additionalBalance = BigInt(balance);
            const newBalance = existingBalance + additionalBalance;
            balanceMap[coinType].balance = newBalance.toString();
            balanceMap[coinType].formattedBalance = (
              Number(newBalance) / Math.pow(10, decimals)
            ).toFixed(6);
          } else {
            // Otherwise create a new entry
            balanceMap[coinType] = {
              type: coinType,
              symbol,
              balance: balance,
              decimals,
              formattedBalance: (
                Number(balance) / Math.pow(10, decimals)
              ).toFixed(6),
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

    fetchBalances();

    // Refresh balances periodically (every 30 seconds)
    const intervalId = setInterval(fetchBalances, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [currentAccount?.address, suiClient]);

  // Get balance for a specific token
  const getTokenBalance = (tokenType: string): TokenBalance | undefined => {
    if (!tokenType) return undefined;
    return walletBalances.find((balance) => balance.type === tokenType);
  };

  const executeTransaction = async (
    transactionBlock: TransactionBlock
  ): Promise<SuiTransactionBlockResponse | undefined> => {
    if (!currentAccount) {
      setError("Wallet not connected");
      return undefined;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const result = await signAndExecute({
        transactionBlock,
        options: {
          showEffects: true,
          showObjectChanges: true,
          showEvents: true,
        },
      });

      setLastTxId(result.digest);

      // Refresh balances after a successful transaction
      setTimeout(async () => {
        try {
          // Get all coins owned by the user
          const allCoins = await suiClient.getAllCoins({
            owner: currentAccount.address,
          });

          // Process the coins into a more usable format with proper grouping by type
          const balanceMap: Record<string, TokenBalance> = {};

          for (const coin of allCoins.data) {
            if (!coin.coinType || !coin.balance) continue;

            const coinType = coin.coinType;
            const balance = coin.balance;
            const decimals = 9; // Default decimals for SUI tokens
            const symbol = coinType.split("::").pop() || "UNKNOWN";

            // If this coin type already exists in our map, add to its balance
            if (balanceMap[coinType]) {
              const existingBalance = BigInt(balanceMap[coinType].balance);
              const additionalBalance = BigInt(balance);
              const newBalance = existingBalance + additionalBalance;
              balanceMap[coinType].balance = newBalance.toString();
              balanceMap[coinType].formattedBalance = (
                Number(newBalance) / Math.pow(10, decimals)
              ).toFixed(6);
            } else {
              // Otherwise create a new entry
              balanceMap[coinType] = {
                type: coinType,
                symbol,
                balance: balance,
                decimals,
                formattedBalance: (
                  Number(balance) / Math.pow(10, decimals)
                ).toFixed(6),
              };
            }
          }

          // Convert the map to an array and sort by balance (highest first)
          const balances = Object.values(balanceMap).sort((a, b) => {
            return Number(b.balance) - Number(a.balance);
          });

          setWalletBalances(balances);
        } catch (err) {
          console.error("Failed to refresh balances after transaction:", err);
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

  return {
    connected: !!currentAccount,
    account: currentAccount,
    address: currentAccount?.address,
    client: suiClient,
    executeTransaction,
    isExecuting,
    lastTxId,
    error,
    clearError: () => setError(null),
    walletBalances,
    isLoadingBalances,
    getTokenBalance,
    // For compatibility with your current code
    provider: suiClient,
    suiClient,
  };
}
