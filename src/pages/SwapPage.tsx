import React, { useState, useEffect } from "react";
import { WalletConnect } from "../components/wallet/WalletConnect";
import { useSuiWallet } from "../hooks/useSuiWallet";
import TokenAmountInput from "../components/swap/TokenAmountInput";
import { Coin } from "../types/api";
import axios from "axios";

const Swap: React.FC = () => {
  const { connected, address, executeTransaction, isExecuting, error } =
    useSuiWallet();
  const [supportedTokens, setSupportedTokens] = useState<Coin[]>([]);
  const [fromToken, setFromToken] = useState<string | undefined>();
  const [toToken, setToToken] = useState<string | undefined>();
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<number>(0.5);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load supported tokens
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await axios.get("/api/supported-tokens");
        if (Array.isArray(response.data)) {
          // Transform token addresses to Coin objects if needed
          const tokens = response.data.map((token: string) => {
            const symbol = token.split("::").pop() || "UNKNOWN";
            return {
              type: token,
              symbol,
              name: symbol,
              decimals: 9,
              price: 0,
            };
          });
          setSupportedTokens(tokens);
        } else {
          // Try the other endpoint format
          const fallbackResponse = await axios.get("/api/coins/list");
          if (
            fallbackResponse.data.success &&
            Array.isArray(fallbackResponse.data.data)
          ) {
            setSupportedTokens(fallbackResponse.data.data);
          }
        }
      } catch (error) {
        console.error("Failed to load supported tokens:", error);
      }
    };

    fetchTokens();
  }, []);

  const handleSwap = async () => {
    if (!connected || !address) {
      alert("Please connect your wallet");
      return;
    }

    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      alert("Please enter valid swap details");
      return;
    }

    setIsLoading(true);
    try {
      // Get the transaction block from your API
      const response = await axios.post("/api/swap", {
        coinInType: fromToken,
        coinOutType: toToken,
        amountIn: fromAmount,
        slippage: slippage / 100, // Convert to decimal
        walletAddress: address,
      });

      if (response.data && response.data.txBytes) {
        // The response contains serialized transaction bytes
        // We need to deserialize and execute
        const TransactionBlock = (await import("@mysten/sui.js/transactions"))
          .TransactionBlock;
        const txb = TransactionBlock.from(response.data.txBytes);

        // Execute the transaction using our hook
        const result = await executeTransaction(txb);
        if (result) {
          alert(`Swap successful! Transaction ID: ${result.digest}`);
        }
      } else {
        throw new Error("Invalid response from swap API");
      }
    } catch (error) {
      console.error("Swap failed:", error);
      alert("Failed to execute swap. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="swap-container">
      <h1>Swap</h1>

      {!connected ? (
        <div className="connect-prompt">
          <h2>Connect your wallet to start swapping</h2>
          <WalletConnect connectText="Connect Wallet" />
        </div>
      ) : (
        <div className="swap-form">
          <TokenAmountInput
            amount={fromAmount}
            onChange={setFromAmount}
            selectedToken={fromToken}
            supportedTokens={supportedTokens}
            onSelectToken={setFromToken}
            label="Swap from"
            balance="0.0" // You should fetch the real balance
          />

          <div className="swap-arrow">↓</div>

          <TokenAmountInput
            amount={toAmount}
            onChange={setToAmount}
            selectedToken={toToken}
            supportedTokens={supportedTokens}
            onSelectToken={setToToken}
            label="Swap to"
            readonly={true}
          />

          <div className="slippage-settings">
            <label>Slippage Tolerance</label>
            <div className="slippage-options">
              <button
                className={slippage === 0.5 ? "active" : ""}
                onClick={() => setSlippage(0.5)}
              >
                0.5%
              </button>
              <button
                className={slippage === 1 ? "active" : ""}
                onClick={() => setSlippage(1)}
              >
                1%
              </button>
              <button
                className={slippage === 2 ? "active" : ""}
                onClick={() => setSlippage(2)}
              >
                2%
              </button>
            </div>
          </div>

          <button
            className="swap-button"
            onClick={handleSwap}
            disabled={
              isLoading || isExecuting || !fromToken || !toToken || !fromAmount
            }
          >
            {isLoading || isExecuting ? "Processing..." : "Swap"}
          </button>

          {error && <div className="error-message">{error}</div>}
        </div>
      )}

      <style jsx>{`
        .swap-container {
          max-width: 480px;
          margin: 0 auto;
          padding: 2rem;
        }

        h1 {
          text-align: center;
          margin-bottom: 2rem;
          color: #0df;
        }

        .connect-prompt {
          text-align: center;
          padding: 3rem 1rem;
          background-color: rgba(20, 21, 43, 0.6);
          border-radius: 12px;
          border: 1px solid rgba(0, 221, 255, 0.1);
        }

        .connect-prompt h2 {
          margin-bottom: 2rem;
          color: #9baacf;
          font-size: 1.25rem;
        }

        .swap-form {
          background-color: rgba(20, 21, 43, 0.6);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(0, 221, 255, 0.1);
        }

        .swap-arrow {
          text-align: center;
          font-size: 1.5rem;
          padding: 0.5rem;
          color: #0df;
        }

        .slippage-settings {
          margin: 1.5rem 0;
        }

        .slippage-settings label {
          display: block;
          margin-bottom: 0.5rem;
          color: #9baacf;
        }

        .slippage-options {
          display: flex;
          gap: 0.5rem;
        }

        .slippage-options button {
          flex: 1;
          padding: 0.5rem;
          background-color: rgba(27, 28, 58, 0.5);
          border: 1px solid rgba(155, 170, 207, 0.2);
          border-radius: 4px;
          color: #9baacf;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .slippage-options button.active {
          background-color: rgba(0, 221, 255, 0.1);
          border-color: rgba(0, 221, 255, 0.3);
          color: #0df;
        }

        .swap-button {
          width: 100%;
          padding: 1rem;
          margin-top: 1rem;
          background-color: rgba(0, 221, 255, 0.2);
          color: #0df;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .swap-button:hover:not(:disabled) {
          background-color: rgba(0, 221, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 221, 255, 0.2);
        }

        .swap-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: rgba(255, 59, 92, 0.1);
          border: 1px solid rgba(255, 59, 92, 0.2);
          color: #ff3b5c;
          border-radius: 4px;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

export default Swap;
