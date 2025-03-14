import React, { useState, useEffect } from "react";
import { useWallet as useSuietWallet } from "@suiet/wallet-kit";
import { ConnectButton as SuietConnectButton } from "@suiet/wallet-kit";
import TokenAmountInput from "../components/swap/TokenAmountInput";
import { Coin } from "../types/api";
import axios from "axios";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { suiClient } from "../main"; // Import the suiClient from main.tsx

const Swap: React.FC = () => {
  // Current date and time for the application
  const currentDateTimeUTC = "2025-03-14 06:38:50";
  const currentUser = "jake1318";

  // Suiet wallet hook
  const suietWallet = useSuietWallet();
  const connected = suietWallet.connected && !!suietWallet.account;
  const address = suietWallet.account?.address;
  const isExecuting = suietWallet.connecting;

  // Debug wallet connection status
  useEffect(() => {
    console.log("SwapPage: Wallet connection status changed");
    console.log("Connected:", connected);
    console.log("Address:", address);
  }, [connected, address]);

  // State variables
  const [showWalletOptions, setShowWalletOptions] = useState(false);
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
  const [error, setError] = useState<string | null>(null);
  const [walletBalances, setWalletBalances] = useState<any[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

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
  // Effect to load wallet balances when connected
  useEffect(() => {
    const fetchBalances = async () => {
      if (!connected || !address) return;

      console.log("SwapPage: Fetching wallet balances for address:", address);
      setIsLoadingBalances(true);

      try {
        const allCoins = await suiClient.getAllCoins({
          owner: address,
        });

        console.log(
          "SwapPage: Raw coins data:",
          allCoins.data.length,
          "coins found"
        );

        // Process the coins
        const balanceMap: Record<string, any> = {};

        for (const coin of allCoins.data) {
          if (!coin.coinType || !coin.balance) continue;

          const coinType = coin.coinType;
          const balance = coin.balance;
          const decimals = getTokenDecimals(coinType); // Add helper function
          const symbol = extractSymbol(coinType); // Add helper function

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
            balanceMap[coinType] = {
              type: coinType,
              symbol,
              balance: balance,
              decimals,
              formattedBalance: formatBalance(balance, decimals),
            };
          }
        }

        // Convert to array and sort
        const suietBalances = Object.values(balanceMap).sort(
          (a, b) => Number(b.balance) - Number(a.balance)
        );

        console.log("SwapPage: Processed balances:", suietBalances);
        setWalletBalances(suietBalances);
      } catch (error) {
        console.error("Failed to load wallet balances:", error);
        setError("Failed to load wallet balances");
      } finally {
        setIsLoadingBalances(false);
      }
    };

    // Helper function to get decimals for a token
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

    if (connected) {
      console.log("SwapPage: Connected! Fetching balances...");
      fetchBalances();

      // Refresh balances periodically
      const intervalId = setInterval(fetchBalances, 30000);
      return () => clearInterval(intervalId);
    } else {
      console.log("SwapPage: Not connected, no balances to fetch");
      setWalletBalances([]);
    }
  }, [connected, address]);

  // Handle Suiet wallet connection events
  useEffect(() => {
    if (!suietWallet || !suietWallet.on) return;

    const handleAccountChange = (params: any) => {
      console.log("SwapPage: Account changed event:", params);
      if (params.account && params.account.address) {
        console.log("SwapPage: New account connected:", params.account.address);
      }
    };

    suietWallet.on("accountChange", handleAccountChange);

    return () => {
      if (suietWallet.off) {
        suietWallet.off("accountChange", handleAccountChange);
      }
    };
  }, [suietWallet]);

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
    console.log("SwapPage: Combined tokens:", mergedTokens.length);
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
        `SwapPage: Found balance for ${fromToken}: ${balance.formattedBalance}`
      );
    } else {
      console.log(`SwapPage: No balance found for ${fromToken}`);
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
        console.log("SwapPage: Fetching supported tokens");
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
          console.log(`SwapPage: Found ${tokens.length} tokens from API`);
          setSupportedTokens(tokens);

          // Set default tokens if available
          if (tokens.length > 0 && !fromToken) {
            const suiToken = tokens.find(
              (t) => t.symbol.toLowerCase() === "sui"
            );
            if (suiToken) {
              console.log("SwapPage: Setting default from token to SUI");
              setFromToken(suiToken.type);
            } else {
              console.log(
                "SwapPage: Setting default from token to first token in list"
              );
              setFromToken(tokens[0].type);
            }

            if (tokens.length > 1 && !toToken) {
              const usdcToken = tokens.find(
                (t) => t.symbol.toLowerCase() === "usdc"
              );
              if (usdcToken) {
                console.log("SwapPage: Setting default to token to USDC");
                setToToken(usdcToken.type);
              } else {
                console.log(
                  "SwapPage: Setting default to token to second token in list"
                );
                setToToken(tokens[1].type);
              }
            }
          }
        } else {
          // Try the other endpoint format
          console.log("SwapPage: First endpoint failed, trying fallback");
          const fallbackResponse = await axios.get("/api/coins/list");
          if (
            fallbackResponse.data.success &&
            Array.isArray(fallbackResponse.data.data)
          ) {
            console.log("SwapPage: Found tokens from fallback endpoint");
            setSupportedTokens(fallbackResponse.data.data);
          }
        }
      } catch (error) {
        console.error("Failed to load supported tokens:", error);
      }
    };

    fetchTokens();
  }, []);

  // Handle Suiet wallet connect success
  const handleConnectSuccess = (account: any) => {
    console.log("SwapPage: Wallet connected successfully:", account);
    setShowWalletOptions(false);

    // Refresh UI to show connected state
    setTimeout(() => {
      if (connected && address) {
        console.log("SwapPage: Connection confirmed, refreshing balances");
      }
    }, 500);
  };

  // Handle percentage buttons click
  const handlePercentageClick = (percentage: number) => {
    try {
      const balance = parseFloat(currentBalance);
      if (isNaN(balance) || balance <= 0) return;

      // Calculate amount based on percentage of balance
      const amount = (balance * percentage).toFixed(6);
      // Remove trailing zeros
      const cleanAmount = amount.replace(/\.?0+$/, "");
      console.log(
        `SwapPage: Setting amount to ${cleanAmount} (${
          percentage * 100
        }% of ${balance})`
      );
      setFromAmount(cleanAmount);
    } catch (error) {
      console.error("Error calculating percentage amount:", error);
    }
  };

  // Execute transaction with Suiet wallet only
  const executeTransaction = async (txb: TransactionBlock) => {
    if (!connected || !suietWallet.account) {
      console.log(
        "SwapPage: Cannot execute transaction - wallet not connected"
      );
      return null;
    }

    console.log("SwapPage: Executing transaction with Suiet wallet");
    try {
      // Using Suiet wallet to execute transaction
      const result = await suietWallet.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      console.log("SwapPage: Transaction execution successful:", result.digest);
      return result;
    } catch (error) {
      console.error("Transaction execution failed:", error);
      return null;
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
      console.log("SwapPage: Sending swap request with:", {
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

      console.log("SwapPage: Swap API response:", response.data);

      if (response.data && response.data.txBytes) {
        // The response contains serialized transaction bytes
        setStatusMessage("Please sign the transaction in your wallet...");

        // Deserialize transaction
        const txb = TransactionBlock.from(response.data.txBytes);

        console.log("SwapPage: Transaction block created successfully");

        // Execute the transaction using our wallet hook
        console.log("SwapPage: Executing transaction...");
        const result = await executeTransaction(txb);
        console.log("SwapPage: Transaction result:", result);

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

  // Updated handle disconnect function for Suiet wallet only
  const handleDisconnect = async () => {
    try {
      console.log("SwapPage: Attempting to disconnect wallet");

      if (connected) {
        await suietWallet.disconnect();
        console.log("SwapPage: Suiet wallet disconnected");

        // Force UI refresh to update the state
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      alert("Failed to disconnect wallet. Please try again.");

      // Force refresh even if there was an error
      window.location.reload();
    }
  };
  return (
    <div className="swap-container">
      <h1>After37 DEX</h1>
      <div className="date-display">
        2025-03-14 19:26:13 UTC • User: jake1318
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
            {!connected ? (
              <div className="wallet-options-container">
                {showWalletOptions ? (
                  <div className="wallet-options">
                    <div className="wallet-option">
                      <SuietConnectButton
                        onConnectSuccess={handleConnectSuccess}
                      >
                        <span>Connect Wallet</span>
                      </SuietConnectButton>
                    </div>
                    <button
                      className="back-btn"
                      onClick={() => setShowWalletOptions(false)}
                    >
                      Back
                    </button>
                  </div>
                ) : (
                  <button
                    className="connect-wallet-btn"
                    onClick={() => setShowWalletOptions(true)}
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            ) : (
              <div className="wallet-info">
                <div className="wallet-header">
                  <p className="wallet-address">
                    Address: {address?.substring(0, 8)}...
                    {address?.substring(address.length - 4)}
                  </p>
                  <button className="disconnect-btn" onClick={handleDisconnect}>
                    Disconnect
                  </button>
                </div>
                {isLoadingBalances && (
                  <p className="loading-balances">Loading balances...</p>
                )}
                {!isLoadingBalances && walletBalances.length > 0 && (
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
                {!isLoadingBalances && walletBalances.length === 0 && (
                  <p>No tokens found in wallet</p>
                )}
              </div>
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

        .wallet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .disconnect-btn {
          background-color: rgba(255, 70, 70, 0.1);
          border: 1px solid rgba(255, 70, 70, 0.3);
          color: #ff4646;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .disconnect-btn:hover {
          background-color: rgba(255, 70, 70, 0.2);
        }

        .wallet-address {
          font-size: 0.9rem;
          color: #9baacf;
          margin-top: 0.5rem;
          margin-bottom: 0;
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

        .wallet-options-container {
          position: relative;
        }

        .wallet-options {
          background: rgba(10, 11, 26, 0.8);
          border: 1px solid rgba(0, 221, 255, 0.2);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .wallet-option {
          width: 100%;
        }

        .back-btn {
          margin-top: 5px;
          background-color: rgba(155, 155, 155, 0.1);
          border: 1px solid rgba(155, 155, 155, 0.3);
          color: #9baacf;
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }

        .back-btn:hover {
          background-color: rgba(155, 155, 155, 0.2);
        }

        .connect-wallet-btn {
          background-color: rgba(0, 221, 255, 0.1);
          border: 1px solid rgba(0, 221, 255, 0.3);
          color: #0df;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
        }

        .connect-wallet-btn:hover {
          background-color: rgba(0, 221, 255, 0.2);
          box-shadow: 0 0 10px rgba(0, 221, 255, 0.3);
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

        /* Add styles for Suiet wallet button */
        :global(.suiet-wallet-kit-button) {
          background-color: rgba(0, 221, 255, 0.1) !important;
          border: 1px solid rgba(0, 221, 255, 0.3) !important;
          color: #0df !important;
          padding: 8px 16px !important;
          border-radius: 8px !important;
          font-weight: 500 !important;
          transition: all 0.3s ease !important;
          cursor: pointer !important;
          width: 100% !important;
        }

        :global(.suiet-wallet-kit-button:hover) {
          background-color: rgba(0, 221, 255, 0.2) !important;
          box-shadow: 0 0 10px rgba(0, 221, 255, 0.3) !important;
        }

        .warning {
          color: #ff9d00;
        }
      `}</style>
    </div>
  );
};

export default Swap;
