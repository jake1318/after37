import React, { useState, useEffect } from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import TokenAmountInput from "./TokenAmountInput";
import { Coin, QuoteResult } from "../../types/api";
import { swapApi } from "../../api/api";
import { formatPercentage } from "../../utils/formatters";
import { useWalletAddress } from "../../hooks/useWalletAddress";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface SwapFormProps {
  supportedTokens: Coin[];
}

const SwapForm: React.FC<SwapFormProps> = ({ supportedTokens }) => {
  const { address } = useWalletAddress();
  const currentAccount = useCurrentAccount();

  const [fromToken, setFromToken] = useState<string>("");
  const [toToken, setToToken] = useState<string>("");
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReverse, setIsReverse] = useState<boolean>(false);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [slippage, setSlippage] = useState<number>(0.5); // 0.5%

  // Reset state when tokens change
  useEffect(() => {
    setFromAmount("");
    setToAmount("");
    setQuoteResult(null);
    setQuoteError(null);
  }, [fromToken, toToken]);

  // Get quote when amount changes
  useEffect(() => {
    const getQuote = async () => {
      if (!fromToken || !toToken || (!fromAmount && !toAmount)) {
        setQuoteResult(null);
        return;
      }

      try {
        setIsLoading(true);
        setQuoteError(null);

        const params = isReverse
          ? {
              coinInType: toToken,
              coinOutType: fromToken,
              coinOutAmount: toAmount,
              slippage,
            }
          : {
              coinInType: fromToken,
              coinOutType: toToken,
              coinInAmount: fromAmount,
              slippage,
            };

        const result = await swapApi.getQuote(params);

        if (result) {
          setQuoteResult(result);

          if (isReverse) {
            setFromAmount(result.route.coinIn.amount);
          } else {
            setToAmount(result.route.coinOut.amount);
          }
        }
      } catch (error) {
        console.error("Error getting quote:", error);
        setQuoteError("Failed to get quote. Try again or adjust your input.");
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce to avoid too many API calls
    const debounceTimeout = setTimeout(() => {
      if ((fromAmount && !isReverse) || (toAmount && isReverse)) {
        getQuote();
      }
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [fromToken, toToken, fromAmount, toAmount, isReverse, slippage]);

  const handleSwapTokens = () => {
    const tempFromToken = fromToken;
    const tempToToken = toToken;

    setFromToken(tempToToken);
    setToToken(tempFromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
    setQuoteResult(null);
  };

  const handleFromAmountChange = (value: string) => {
    setIsReverse(false);
    setFromAmount(value);
    if (!value) setToAmount("");
  };

  const handleToAmountChange = (value: string) => {
    setIsReverse(true);
    setToAmount(value);
    if (!value) setFromAmount("");
  };

  const handleSwap = async () => {
    // In a real implementation, this would call the Sui blockchain to execute the swap
    // For this prototype, we'll just show a success message
    alert("Swap feature not implemented in this prototype");
  };

  const getButtonText = () => {
    if (!address) return "Connect Wallet";
    if (!fromToken || !toToken) return "Select Tokens";
    if (!fromAmount || !toAmount) return "Enter Amount";
    return "Swap";
  };

  const isButtonDisabled = () => {
    return (
      !address ||
      !fromToken ||
      !toToken ||
      !fromAmount ||
      !toAmount ||
      isLoading ||
      !!quoteError
    );
  };

  return (
    <Card variant="primary" className="swap-card">
      <div className="card-header">
        <h3 className="swap-title">Swap</h3>
        <div className="swap-settings">
          <button className="setting-btn" title="Settings">
            ⚙️
          </button>
        </div>
      </div>

      <div className="swap-inputs">
        <TokenAmountInput
          label="From"
          amount={fromAmount}
          onChange={handleFromAmountChange}
          selectedToken={fromToken}
          supportedTokens={supportedTokens}
          onSelectToken={(token) => setFromToken(token)}
          disabled={isLoading}
          balance={fromToken ? "1000" : undefined} // Mock balance
          onMaxClick={() => handleFromAmountChange("1000")} // Mock max click
        />

        <div className="swap-divider">
          <button className="swap-arrow-btn" onClick={handleSwapTokens}>
            ↓
          </button>
        </div>

        <TokenAmountInput
          label="To"
          amount={toAmount}
          onChange={handleToAmountChange}
          selectedToken={toToken}
          supportedTokens={supportedTokens}
          onSelectToken={(token) => setToToken(token)}
          disabled={isLoading}
          readonly={!isReverse && !!fromAmount}
          balance={toToken ? "500" : undefined} // Mock balance
        />
      </div>

      {quoteResult && (
        <div className="swap-details">
          <div className="detail-item">
            <span className="detail-label">Price</span>
            <span className="detail-value">
              1 {quoteResult.route.coinOut.symbol} = {quoteResult.route.price}{" "}
              {quoteResult.route.coinIn.symbol}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Minimum Received</span>
            <span className="detail-value">
              {quoteResult.route.minimumReceived}{" "}
              {quoteResult.route.coinOut.symbol}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Price Impact</span>
            <span
              className={`detail-value ${
                Number(quoteResult.route.priceImpact) > 5 ? "high-impact" : ""
              }`}
            >
              {formatPercentage(quoteResult.route.priceImpact)}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Route</span>
            <span className="detail-value">
              {quoteResult.route.path.join(" → ")}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Slippage Tolerance</span>
            <span className="detail-value">{formatPercentage(slippage)}</span>
          </div>
        </div>
      )}

      {quoteError && <div className="error-message">{quoteError}</div>}

      <div className="swap-button-container">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={handleSwap}
          disabled={isButtonDisabled()}
          loading={isLoading}
        >
          {getButtonText()}
        </Button>
      </div>

      <style jsx>{`
        .swap-title {
          font-size: 1.25rem;
          margin: 0;
        }

        .swap-settings {
          display: flex;
          gap: 8px;
        }

        .setting-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #9baacf;
          transition: color 0.3s ease;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .setting-btn:hover {
          color: #fff;
          background: rgba(155, 170, 207, 0.1);
        }

        .swap-inputs {
          margin: 20px 0;
          position: relative;
        }

        .swap-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          margin: -12px 0;
          z-index: 10;
        }

        .swap-arrow-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(20, 21, 43, 0.8);
          border: 1px solid rgba(0, 221, 255, 0.3);
          color: #0df;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 16px;
        }

        .swap-arrow-btn:hover {
          transform: scale(1.1);
          background: rgba(0, 221, 255, 0.1);
          box-shadow: 0 0 10px rgba(0, 221, 255, 0.5);
        }

        .swap-details {
          padding: 16px;
          background: rgba(20, 21, 43, 0.4);
          border-radius: 8px;
          font-size: 0.875rem;
          margin-bottom: 20px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .detail-item:last-child {
          margin-bottom: 0;
        }

        .detail-label {
          color: #9baacf;
        }

        .detail-value {
          color: #fff;
          font-family: "Share Tech Mono", monospace;
        }

        .high-impact {
          color: #ff3b5c;
        }

        .error-message {
          margin-bottom: 20px;
          padding: 12px 16px;
          background: rgba(255, 59, 92, 0.1);
          border-left: 3px solid #ff3b5c;
          border-radius: 4px;
          color: #ff3b5c;
          font-size: 0.875rem;
        }
      `}</style>
    </Card>
  );
};

export default SwapForm;
