import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransactionBlock,
} from "@mysten/dapp-kit";

import { SuiTransactionBlockResponse } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useState } from "react";

export function useSuiWallet() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastTxId, setLastTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: signAndExecute } = useSignAndExecuteTransactionBlock();

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
  };
}
