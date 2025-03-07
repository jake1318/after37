import React, { useState, useEffect, useRef, useCallback } from "react";
import { Coin } from "../../types/api";
import { formatBalance } from "../../utils/formatters";
import axios from "axios";
import { coinsApi } from "../../api/api"; // Import from your api.ts file

interface TokenAmountInputProps {
  amount: string;
  onChange: (value: string) => void;
  selectedToken?: string;
  supportedTokens: Coin[];
  onSelectToken: (tokenType: string) => void;
  disabled?: boolean;
  readonly?: boolean;
  label: string;
  placeholder?: string;
  balance?: string;
  onMaxClick?: () => void;
}

// Create TokenIcon component inline
const TokenIcon: React.FC<{
  symbol: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ symbol, size = 24, className = "", style = {} }) => {
  const [hasError, setHasError] = useState(false);
  const cleanSymbol = (symbol || "").toLowerCase();

  // Create fallback for when icons fail to load
  const getInitials = () => {
    return (symbol || "UN").substring(0, 2).toUpperCase();
  };

  // Generate a deterministic color based on the token symbol
  const generateColor = () => {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }

    const h = hash % 360;
    return `hsl(${h}, 70%, 60%)`;
  };

  if (hasError) {
    return (
      <div
        className={`token-icon-fallback ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: generateColor(),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.4,
          fontWeight: "bold",
          color: "#fff",
          ...style,
        }}
      >
        {getInitials()}
      </div>
    );
  }

  return (
    <img
      src={`https://sui-icons.vercel.app/coins/${cleanSymbol}.png`}
      alt={symbol}
      className={`token-icon ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "rgba(10, 11, 26, 0.5)",
        objectFit: "cover",
        ...style,
      }}
      onError={() => setHasError(true)}
    />
  );
};

const TokenAmountInput: React.FC<TokenAmountInputProps> = ({
  amount,
  onChange,
  selectedToken,
  supportedTokens,
  onSelectToken,
  disabled = false,
  readonly = false,
  label,
  placeholder = "0.0",
  balance,
  onMaxClick,
}) => {
  const [selectedTokenData, setSelectedTokenData] = useState<
    Coin | undefined
  >();
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayedTokens, setDisplayedTokens] = useState<Coin[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (selectedToken) {
      const token = supportedTokens.find((t) => t.type === selectedToken);
      setSelectedTokenData(token);
    }
  }, [selectedToken, supportedTokens]);

  // Helper function to convert token address to token object
  const addressToToken = useCallback(
    (address: string): Coin => {
      // Try to find in supportedTokens first
      const existingToken = supportedTokens.find((t) => t.type === address);
      if (existingToken) return existingToken;

      // Create a basic token if not found
      const symbol = address.split("::").pop() || "UNKNOWN";
      return {
        type: address,
        symbol,
        name: symbol,
        decimals: 9,
        price: 0,
      };
    },
    [supportedTokens]
  );

  // Search for tokens when query changes
  const searchTokens = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setDisplayedTokens(supportedTokens.slice(0, 50));
        return;
      }

      try {
        setIsSearching(true);
        setSearchError("");

        // Try using the coinsApi.searchCoins function if available
        if (typeof coinsApi?.searchCoins === "function") {
          const results = await coinsApi.searchCoins(query);
          setDisplayedTokens(results);
          setIsSearching(false);
          return;
        }

        // Fallback to direct API calls
        const response = await axios.get(
          `/api/search-tokens?query=${encodeURIComponent(query)}`
        );

        if (Array.isArray(response.data)) {
          // Convert addresses to tokens
          const tokens = response.data.map(addressToToken);
          setDisplayedTokens(tokens);
        } else {
          // Fallback to the current API endpoint
          const fallbackResponse = await axios.get(
            `/api/coins/search?query=${encodeURIComponent(query)}`
          );

          if (
            fallbackResponse.data.success &&
            Array.isArray(fallbackResponse.data.data)
          ) {
            setDisplayedTokens(fallbackResponse.data.data);
          } else {
            setDisplayedTokens([]);
            setSearchError("Failed to search tokens");
          }
        }
      } catch (error) {
        console.error("Error searching tokens:", error);
        setSearchError("Error searching tokens");
        setDisplayedTokens([]);
      } finally {
        setIsSearching(false);
      }
    },
    [supportedTokens, addressToToken]
  );

  // Debounce search to avoid too many requests
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Initialize with first 50 tokens when modal opens
    if (!searchQuery) {
      setDisplayedTokens(supportedTokens.slice(0, 50));
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchTokens(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchTokens, supportedTokens]);

  // Initialize tokens when modal opens
  useEffect(() => {
    if (isTokenSelectorOpen) {
      setDisplayedTokens(supportedTokens.slice(0, 50));
      setSearchQuery("");
    }
  }, [isTokenSelectorOpen, supportedTokens]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numeric input with decimals
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      onChange(value);
    }
  };

  // Handle click outside to close the modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsTokenSelectorOpen(false);
      }
    }

    if (isTokenSelectorOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isTokenSelectorOpen]);

  const handleTokenSelect = (token: Coin) => {
    onSelectToken(token.type);
    setIsTokenSelectorOpen(false);
    setSearchQuery("");
  };

  // Load supported tokens when first opening
  const loadSupportedTokens = useCallback(async () => {
    try {
      if (typeof coinsApi?.getSupportedCoins === "function") {
        const tokens = await coinsApi.getSupportedCoins();
        setDisplayedTokens(tokens.slice(0, 50));
        return;
      }

      const response = await axios.get("/api/supported-tokens");
      if (Array.isArray(response.data) && response.data.length > 0) {
        const tokens = response.data.map(addressToToken);
        setDisplayedTokens(tokens.slice(0, 50));
      }
    } catch (error) {
      console.error("Failed to load supported tokens:", error);
    }
  }, [addressToToken]);

  // Close token selector when ESC key is pressed
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsTokenSelectorOpen(false);
      }
    };

    if (isTokenSelectorOpen) {
      document.addEventListener("keydown", handleEscKey);

      // Try loading tokens from the example server endpoint
      if (displayedTokens.length === 0) {
        loadSupportedTokens();
      }

      return () => {
        document.removeEventListener("keydown", handleEscKey);
      };
    }
  }, [isTokenSelectorOpen, displayedTokens.length, loadSupportedTokens]);

  // Define z-index for the token modal to ensure it appears on top
  const TOKEN_MODAL_Z_INDEX = 9999;

  return (
    <div className="token-amount-input-container">
      <div className="input-header">
        <label>{label}</label>
        {balance && (
          <div className="balance">
            Balance: {formatBalance(balance)}
            {onMaxClick && (
              <button className="max-button" onClick={onMaxClick}>
                MAX
              </button>
            )}
          </div>
        )}
      </div>

      <div className="input-container">
        <div className="amount-container">
          <input
            type="text"
            value={amount}
            onChange={handleInputChange}
            disabled={disabled || readonly}
            readOnly={readonly}
            placeholder={placeholder}
            className="amount-input"
          />
          {selectedTokenData && (
            <div className="usd-value">
              ≈ $
              {(Number(amount || "0") * (selectedTokenData.price || 0)).toFixed(
                2
              )}
            </div>
          )}
        </div>

        <div
          className={`token-selector ${disabled ? "disabled" : ""}`}
          onClick={() => !disabled && setIsTokenSelectorOpen(true)}
        >
          {selectedTokenData ? (
            <>
              {/* Replace with TokenIcon component */}
              <TokenIcon
                symbol={selectedTokenData.symbol}
                size={24}
                className="token-icon"
              />
              <span className="token-symbol">{selectedTokenData.symbol}</span>
              <span className="dropdown-icon">▼</span>
            </>
          ) : (
            <>
              <span className="select-token">Select token</span>
              <span className="dropdown-icon">▼</span>
            </>
          )}
        </div>
      </div>

      {isTokenSelectorOpen && (
        <div
          className="token-modal-overlay"
          style={{ zIndex: TOKEN_MODAL_Z_INDEX }}
        >
          <div className="token-modal" ref={modalRef}>
            <div className="modal-header">
              <h3>Select a token</h3>
              <button
                className="close-button"
                onClick={() => setIsTokenSelectorOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="search-container">
              <input
                type="text"
                placeholder="Search name or paste address"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                autoFocus
              />
            </div>

            <div className="tokens-list">
              {isSearching ? (
                <div className="loading-state">Searching tokens...</div>
              ) : searchError ? (
                <div className="error-state">
                  <p>{searchError}</p>
                  <button onClick={() => searchTokens(searchQuery)}>
                    Retry
                  </button>
                </div>
              ) : displayedTokens.length > 0 ? (
                displayedTokens.map((token) => (
                  <div
                    key={token.type}
                    className={`token-item ${
                      selectedToken === token.type ? "selected" : ""
                    }`}
                    onClick={() => handleTokenSelect(token)}
                  >
                    <div className="token-info">
                      {/* Replace with TokenIcon component */}
                      <TokenIcon
                        symbol={token.symbol}
                        size={24}
                        className="token-icon"
                      />
                      <div className="token-details">
                        <div className="token-symbol">{token.symbol}</div>
                        <div className="token-name">
                          {token.name || token.symbol}
                        </div>
                      </div>
                    </div>

                    <div className="token-price">
                      {token.price ? `$${token.price.toFixed(2)}` : ""}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  {searchQuery
                    ? `No tokens found matching "${searchQuery}"`
                    : "No tokens available"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .token-amount-input-container {
          margin-bottom: 1rem;
        }

        .input-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        label {
          color: #9baacf;
        }

        .balance {
          color: #9baacf;
          display: flex;
          align-items: center;
        }

        .max-button {
          margin-left: 0.5rem;
          background: none;
          border: none;
          color: #0df;
          font-size: 0.75rem;
          cursor: pointer;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          transition: background-color 0.3s ease;
        }

        .max-button:hover {
          background-color: rgba(0, 221, 255, 0.1);
          text-shadow: 0 0 5px rgba(0, 221, 255, 0.5);
        }

        .input-container {
          display: flex;
          border: 1px solid rgba(155, 170, 207, 0.2);
          border-radius: 0.75rem;
          overflow: hidden;
          background-color: rgba(20, 21, 43, 0.6);
        }

        .amount-container {
          flex: 1;
          padding: 0.75rem 1rem;
          display: flex;
          flex-direction: column;
        }

        .amount-input {
          width: 100%;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 1.25rem;
          font-family: "Share Tech Mono", monospace;
        }

        .amount-input:focus {
          outline: none;
        }

        .amount-input::placeholder {
          color: rgba(155, 170, 207, 0.5);
        }

        .amount-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .usd-value {
          font-size: 0.75rem;
          color: #5d6785;
          margin-top: 0.25rem;
        }

        .token-selector {
          display: flex;
          align-items: center;
          padding: 0 1rem;
          background-color: rgba(27, 28, 58, 0.5);
          cursor: pointer;
          transition: background-color 0.3s ease;
          min-width: 130px;
          border-left: 1px solid rgba(155, 170, 207, 0.1);
        }

        .token-selector:hover:not(.disabled) {
          background-color: rgba(27, 28, 58, 0.8);
        }

        .token-selector.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .token-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          margin-right: 0.5rem;
          background-color: rgba(20, 21, 43, 0.5);
        }

        .token-symbol {
          flex: 1;
          font-weight: 500;
        }

        .select-token {
          flex: 1;
          color: #9baacf;
        }

        .dropdown-icon {
          font-size: 0.75rem;
          color: #9baacf;
          margin-left: 0.5rem;
        }

        /* Modal styles */
        .token-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(6, 7, 20, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .token-modal {
          background-color: rgba(20, 21, 43, 0.95);
          border-radius: 0.75rem;
          width: 90%;
          max-width: 480px;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0, 221, 255, 0.3);
          border: 1px solid rgba(0, 221, 255, 0.1);
          position: relative;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid rgba(155, 170, 207, 0.1);
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          color: #fff;
          text-shadow: 0 0 5px rgba(0, 221, 255, 0.5);
        }

        .close-button {
          background: none;
          border: none;
          color: #9baacf;
          font-size: 1.5rem;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .close-button:hover {
          color: #fff;
        }

        .search-container {
          padding: 1rem;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background-color: rgba(10, 11, 26, 0.6);
          border: 1px solid rgba(155, 170, 207, 0.2);
          border-radius: 0.5rem;
          color: #fff;
          font-family: "Share Tech Mono", monospace;
        }

        .search-input:focus {
          outline: none;
          border-color: rgba(0, 221, 255, 0.5);
          box-shadow: 0 0 0 2px rgba(0, 221, 255, 0.2);
        }

        .tokens-list {
          max-height: 350px;
          overflow-y: auto;
          padding: 0 0.5rem 1rem;
        }

        .tokens-list::-webkit-scrollbar {
          width: 5px;
        }

        .tokens-list::-webkit-scrollbar-track {
          background: rgba(10, 11, 26, 0.5);
        }

        .tokens-list::-webkit-scrollbar-thumb {
          background-color: rgba(0, 221, 255, 0.5);
          border-radius: 4px;
        }

        .token-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .token-item:hover {
          background-color: rgba(27, 28, 58, 0.8);
        }

        .token-item.selected {
          background-color: rgba(0, 221, 255, 0.1);
          border: 1px solid rgba(0, 221, 255, 0.2);
        }

        .token-info {
          display: flex;
          align-items: center;
        }

        .token-details {
          margin-left: 0.75rem;
        }

        .token-name {
          font-size: 0.75rem;
          color: #9baacf;
          margin-top: 0.25rem;
        }

        .token-price {
          font-size: 0.875rem;
          color: #9baacf;
          font-family: "Share Tech Mono", monospace;
        }

        .no-results {
          padding: 2rem 1rem;
          text-align: center;
          color: #5d6785;
        }

        .loading-state {
          padding: 2rem 1rem;
          text-align: center;
          color: #9baacf;
        }

        .error-state {
          padding: 2rem 1rem;
          text-align: center;
          color: #ff3b5c;
        }

        .error-state button {
          margin-top: 1rem;
          background: rgba(255, 59, 92, 0.1);
          border: 1px solid rgba(255, 59, 92, 0.2);
          color: #ff3b5c;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .error-state button:hover {
          background: rgba(255, 59, 92, 0.2);
        }
      `}</style>
    </div>
  );
};

export default TokenAmountInput;
