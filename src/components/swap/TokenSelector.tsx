import React, { useState, useEffect } from "react";
import { Coin } from "../../types/api";

interface TokenSelectorProps {
  selectedToken?: string;
  onSelectToken: (tokenType: string) => void;
  supportedTokens: Coin[];
  label: string;
  disabled?: boolean;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onSelectToken,
  supportedTokens,
  label,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTokenData, setSelectedTokenData] = useState<
    Coin | undefined
  >();

  useEffect(() => {
    if (selectedToken) {
      const token = supportedTokens.find((t) => t.type === selectedToken);
      setSelectedTokenData(token);
    }
  }, [selectedToken, supportedTokens]);

  const filteredTokens = searchQuery.trim()
    ? supportedTokens.filter(
        (token) =>
          token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : supportedTokens;

  const handleSelect = (token: Coin) => {
    onSelectToken(token.type);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="token-selector-container">
      <label className="selector-label">{label}</label>

      <button
        className="token-selector-button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        {selectedTokenData ? (
          <div className="token-display">
            <div
              className="token-icon"
              style={{
                backgroundImage: `url(https://sui-icons.vercel.app/coins/${selectedTokenData.symbol.toLowerCase()}.png)`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <span className="token-symbol">{selectedTokenData.symbol}</span>
            <span className="dropdown-icon">▼</span>
          </div>
        ) : (
          <div className="token-display empty">
            <span>Select a token</span>
            <span className="dropdown-icon">▼</span>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="token-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="token-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select a token</h3>
              <button className="close-button" onClick={() => setIsOpen(false)}>
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
              {filteredTokens.length > 0 ? (
                filteredTokens.map((token) => (
                  <div
                    key={token.type}
                    className={`token-item ${
                      selectedToken === token.type ? "selected" : ""
                    }`}
                    onClick={() => handleSelect(token)}
                  >
                    <div className="token-info">
                      <div
                        className="token-icon"
                        style={{
                          backgroundImage: `url(https://sui-icons.vercel.app/coins/${token.symbol.toLowerCase()}.png)`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                      <div className="token-details">
                        <div className="token-symbol">{token.symbol}</div>
                        <div className="token-name">{token.name}</div>
                      </div>
                    </div>

                    <div className="token-verification">
                      {token.isVerified && (
                        <div className="verified-badge" title="Verified token">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">No tokens found</div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .token-selector-container {
          margin-bottom: 1rem;
        }

        .selector-label {
          display: block;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          color: #9baacf;
        }

        .token-selector-button {
          width: 100%;
          background-color: rgba(20, 21, 43, 0.6);
          border: 1px solid rgba(155, 170, 207, 0.2);
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          cursor: pointer;
          text-align: left;
          transition: all 0.3s ease;
        }

        .token-selector-button:hover:not(:disabled) {
          background-color: rgba(20, 21, 43, 0.8);
          border-color: rgba(0, 221, 255, 0.3);
        }

        .token-selector-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .token-display {
          display: flex;
          align-items: center;
        }

        .token-display.empty {
          color: #5d6785;
        }

        .token-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          margin-right: 0.5rem;
          background-color: rgba(20, 21, 43, 0.5);
          border: 1px solid rgba(155, 170, 207, 0.2);
        }

        .token-symbol {
          font-weight: 500;
          flex: 1;
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

        .verified-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background-color: rgba(0, 255, 102, 0.1);
          border-radius: 50%;
          color: #0f6;
          font-size: 0.75rem;
          box-shadow: 0 0 8px rgba(0, 255, 102, 0.3);
        }

        .no-results {
          padding: 2rem 1rem;
          text-align: center;
          color: #5d6785;
        }
      `}</style>
    </div>
  );
};

export default TokenSelector;
