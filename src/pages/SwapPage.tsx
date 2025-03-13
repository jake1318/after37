import React, { useState, useEffect } from "react";
import { WalletConnect } from "../components/wallet/WalletConnect";
import { useSuiWallet } from "../hooks/useSuiWallet";
import TokenAmountInput from "../components/swap/TokenAmountInput";
import { Coin } from "../types/api";
import axios from "axios";
import { TransactionBlock } from "@mysten/sui.js/transactions";

const Swap: React.FC = () => {
  // Hardcoded values as requested
  const currentDateTimeUTC = "2025-03-08 00:38:42";
  const currentUser = "jake1318";

  const {
    connected,
    address,
    executeTransaction,
    isExecuting,
    error,
    suiClient,
    walletBalances, // Use walletBalances from the hook
    isLoadingBalances,
  } = useSuiWallet();

  const [supportedTokens, setSupportedTokens] = useState<Coin[]>([]);
  const [fromToken, setFromToken] = useState<string | undefined>();
  const [toToken, setToToken] = useState<string | undefined>();
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<number>(0.5);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [txResult, setTxResult] = useState<any>(null);
  const [currentBalance, setCurrentBalance] = useState<string>("0");

  // Merge API tokens with wallet tokens
  const [allAvailableTokens, setAllAvailableTokens] = useState<Coin[]>([]);

  // Info boxes data with default values
  const [protocolInfo, setProtocolInfo] = useState({
    totalPools: 0,
    supportedDEXs: ["Aftermath"], // Default
  });

  const [tokenInfo, setTokenInfo] = useState({
    totalTokens: 0,
    popularTokens: ["SUI", "USDC", "WETH", "USDT"], // Default
  });

  // Combine wallet tokens with supported tokens
  useEffect(() => {
    // Create a map to track existing tokens
    const tokenMap = new Map<string, Coin>();

    // Add supported tokens first
    supportedTokens.forEach((token) => {
      tokenMap.set(token.type, token);
    });

    // Add wallet tokens if not already in the list
    walletBalances.forEach((walletToken) => {
      if (!tokenMap.has(walletToken.type)) {
        tokenMap.set(walletToken.type, {
          type: walletToken.type,
          symbol: walletToken.symbol,
          name: walletToken.symbol,
          decimals: walletToken.decimals,
          price: 0,
        });
      }
    });

    // Convert map back to array
    const mergedTokens = Array.from(tokenMap.values());
    console.log("Combined tokens:", mergedTokens);
    setAllAvailableTokens(mergedTokens);
  }, [supportedTokens, walletBalances]);

  // Update current balance when fromToken changes
  useEffect(() => {
    if (!fromToken) {
      setCurrentBalance("0");
      return;
    }

    const balance = walletBalances.find((b) => b.type === fromToken);
    if (balance) {
      setCurrentBalance(balance.formattedBalance);
      console.log(
        `Found balance for ${fromToken}: ${balance.formattedBalance}`
      );
    } else {
      console.log(`No balance found for ${fromToken}`);
      setCurrentBalance("0");
    }
  }, [fromToken, walletBalances]);

  // Load DEX info
  useEffect(() => {
    const fetchDEXInfo = async () => {
      try {
        const response = await axios.get("/api/info/dex");
        if (response.data.success && response.data.data) {
          setProtocolInfo({
            totalPools: response.data.data.totalPools || 0,
            supportedDEXs: response.data.data.supportedDEXs || ["Aftermath"],
          });
        }
      } catch (error) {
        console.error("Failed to load DEX info:", error);
      }
    };

    fetchDEXInfo();
  }, []);

  // Load token stats
  useEffect(() => {
    const fetchTokenStats = async () => {
      try {
        const response = await axios.get("/api/info/tokens");
        if (response.data.success && response.data.data) {
          setTokenInfo({
            totalTokens: response.data.data.totalTokens || 0,
            popularTokens: response.data.data.popularTokens || [
              "SUI",
              "USDC",
              "WETH",
              "USDT",
            ],
          });
        }
      } catch (error) {
        console.error("Failed to load token stats:", error);
      }
    };

    fetchTokenStats();
  }, []);

  // Load supported tokens
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        // Try to get tokens from the new API endpoint first
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

          // Set default tokens if available
          if (tokens.length > 0 && !fromToken) {
            const suiToken = tokens.find(
              (t) => t.symbol.toLowerCase() === "sui"
            );
            if (suiToken) {
              setFromToken(suiToken.type);
            } else {
              setFromToken(tokens[0].type);
            }

            if (tokens.length > 1 && !toToken) {
              const usdcToken = tokens.find(
                (t) => t.symbol.toLowerCase() === "usdc"
              );
              if (usdcToken) {
                setToToken(usdcToken.type);
              } else {
                setToToken(tokens[1].type);
              }
            }
          }
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

  // Handle percentage buttons click
  const handlePercentageClick = (percentage: number) => {
    try {
      const balance = parseFloat(currentBalance);
      if (isNaN(balance) || balance <= 0) return;

      // Calculate amount based on percentage of balance
      const amount = (balance * percentage).toFixed(6);
      // Remove trailing zeros
      const cleanAmount = amount.replace(/\.?0+$/, "");
      setFromAmount(cleanAmount);
    } catch (error) {
      console.error("Error calculating percentage amount:", error);
    }
  };

  const handleSwap = async () => {
    if (!connected || !address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      alert("Please enter valid swap details");
      return;
    }

    setIsLoading(true);
    setStatusMessage("Preparing swap transaction...");

    try {
      console.log("Sending swap request with:", {
        coinInType: fromToken,
        coinOutType: toToken,
        amountIn: fromAmount,
        slippage: slippage / 100, // Convert to decimal
        walletAddress: address,
      });

      // Get the transaction block from your API
      const response = await axios.post("/api/swap", {
        coinInType: fromToken,
        coinOutType: toToken,
        amountIn: fromAmount,
        slippage: slippage / 100, // Convert to decimal
        walletAddress: address,
      });

      console.log("Swap API response:", response.data);

      if (response.data && response.data.txBytes) {
        // The response contains serialized transaction bytes
        setStatusMessage("Please sign the transaction in your wallet...");

        // Deserialize transaction
        const txb = TransactionBlock.from(response.data.txBytes);

        console.log("Transaction block created successfully");

        // Execute the transaction using our wallet hook
        console.log("Executing transaction...");
        const result = await executeTransaction(txb);
        console.log("Transaction result:", result);

        if (result) {
          setTxResult(result);
          setStatusMessage(`Swap successful! Transaction ID: ${result.digest}`);

          // Show success for 5 seconds, then clear
          setTimeout(() => {
            setStatusMessage("");
          }, 5000);
        }
      } else {
        throw new Error(
          response.data.error || "Invalid response from swap API"
        );
      }
    } catch (error: any) {
      console.error("Swap failed:", error);
      setStatusMessage("");
      alert(`Failed to execute swap: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate if there's at least one token with a balance > 0
  const hasTokensWithBalance = walletBalances.some(
    (token) => parseFloat(token.formattedBalance) > 0
  );

  return (
    <div className="swap-container">
      <h1>After37 DEX</h1>
      <div className="date-display">
        {currentDateTimeUTC} UTC • User: {currentUser}
      </div>

      <div className="info-boxes">
        <div className="info-box">
          <h3>Protocol Information</h3>
          <div className="info-content">
            <p>Total Pools: {protocolInfo.totalPools}</p>
            <p>Supported DEXs: {protocolInfo.supportedDEXs.join(", ")}</p>
          </div>
        </div>

        <div className="info-box">
          <h3>Token Information</h3>
          <div className="info-content">
            <p>Total Tokens: {tokenInfo.totalTokens}</p>
            <p>Popular Tokens: {tokenInfo.popularTokens.join(", ")}</p>
          </div>
        </div>

        <div className="info-box wallet-box">
          <h3>Wallet</h3>
          <div className="info-content">
            <WalletConnect connectText="Connect Wallet" />
            {connected && (
              <p className="wallet-address">
                Address: {address?.substring(0, 8)}...
                {address?.substring(address.length - 4)}
              </p>
            )}
            {connected && isLoadingBalances && (
              <p className="loading-balances">Loading balances...</p>
            )}
            {connected && !isLoadingBalances && walletBalances.length > 0 && (
              <div className="wallet-balances">
                <p>Selected Token Balance: {currentBalance}</p>
                <p className="total-balance">
                  Total Tokens: {walletBalances.length}
                </p>
                {!hasTokensWithBalance && (
                  <p className="warning">No tokens with balance found</p>
                )}
              </div>
            )}
            {connected && !isLoadingBalances && walletBalances.length === 0 && (
              <p>No tokens found in wallet</p>
            )}
          </div>
        </div>
      </div>

      <div className="swap-form">
        <h2>Swap Tokens</h2>

        <TokenAmountInput
          amount={fromAmount}
          onChange={setFromAmount}
          selectedToken={fromToken}
          supportedTokens={allAvailableTokens} // Use merged list here
          onSelectToken={(token) => {
            setFromToken(token);
            const balance = walletBalances.find((b) => b.type === token);
            if (balance) {
              setCurrentBalance(balance.formattedBalance);
            } else {
              setCurrentBalance("0");
            }
          }}
          label="Swap from"
          balance={currentBalance}
        />

        {connected && fromToken && (
          <div className="percentage-buttons">
            <button onClick={() => handlePercentageClick(0.25)}>25%</button>
            <button onClick={() => handlePercentageClick(0.5)}>50%</button>
            <button onClick={() => handlePercentageClick(0.75)}>75%</button>
            <button onClick={() => handlePercentageClick(1)}>Max</button>
          </div>
        )}

        <div className="swap-arrow">↓</div>

        <TokenAmountInput
          amount={toAmount}
          onChange={setToAmount}
          selectedToken={toToken}
          supportedTokens={allAvailableTokens} // Use merged list here too
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
            isLoading ||
            isExecuting ||
            !fromToken ||
            !toToken ||
            !fromAmount ||
            !connected
          }
        >
          {!connected
            ? "Connect Wallet to Swap"
            : isLoading || isExecuting
            ? "Processing..."
            : "Swap"}
        </button>

        {error && <div className="error-message">{error}</div>}

        {statusMessage && <div className="status-message">{statusMessage}</div>}

        {txResult && (
          <div className="transaction-result">
            <p>Transaction successful!</p>
            <a
              href={`https://suivision.xyz/transaction/${txResult.digest}?network=mainnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="tx-link"
            >
              View on SuiVision
            </a>
          </div>
        )}
      </div>

      <style jsx>{`
        .swap-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        h1 {
          text-align: center;
          margin-bottom: 0.5rem;
          color: #0df;
        }

        .date-display {
          text-align: center;
          margin-bottom: 2rem;
          color: #9baacf;
          font-size: 0.9rem;
        }

        h2 {
          text-align: center;
          margin-bottom: 1.5rem;
          color: #0df;
          font-size: 1.5rem;
        }

        .info-boxes {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .info-box {
          background-color: rgba(20, 21, 43, 0.6);
          border-radius: 12px;
          padding: 1rem;
          border: 1px solid rgba(0, 221, 255, 0.1);
        }

        .info-box h3 {
          margin-top: 0;
          color: #0df;
          font-size: 1.2rem;
          margin-bottom: 0.8rem;
        }

        .info-content p {
          margin: 0.5rem 0;
          color: #9baacf;
        }

        .wallet-address {
          font-size: 0.9rem;
          color: #9baacf;
          margin-top: 0.5rem;
        }

        .wallet-balances {
          margin-top: 0.5rem;
          font-size: 0.9rem;
          color: #9baacf;
        }

        .loading-balances {
          font-size: 0.9rem;
          color: #9baacf;
          margin-top: 0.5rem;
          font-style: italic;
        }

        .swap-form {
          background-color: rgba(20, 21, 43, 0.6);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(0, 221, 255, 0.1);
          max-width: 480px;
          margin: 0 auto;
        }

        .percentage-buttons {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          gap: 0.5rem;
        }

        .percentage-buttons button {
          flex: 1;
          background-color: rgba(0, 221, 255, 0.1);
          color: #0df;
          border: 1px solid rgba(0, 221, 255, 0.2);
          border-radius: 6px;
          padding: 0.25rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .percentage-buttons button:hover {
          background-color: rgba(0, 221, 255, 0.2);
          transform: translateY(-1px);
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

        .status-message {
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: rgba(0, 221, 255, 0.1);
          border: 1px solid rgba(0, 221, 255, 0.2);
          color: #0df;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .transaction-result {
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: rgba(10, 255, 157, 0.1);
          border: 1px solid rgba(10, 255, 157, 0.3);
          color: #0aff9d;
          border-radius: 4px;
          text-align: center;
        }

        .tx-link {
          display: inline-block;
          margin-top: 0.5rem;
          color: #0aff9d;
          text-decoration: underline;
        }

        .tx-link:hover {
          color: #fff;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .info-boxes {
            grid-template-columns: 1fr;
          }

          .swap-container {
            padding: 1rem;
          }

          .percentage-buttons {
            flex-wrap: wrap;
          }

          .percentage-buttons button {
            min-width: 60px;
          }
        }
      `}</style>
    </div>
  );
};

export default Swap;
