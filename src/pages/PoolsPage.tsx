import React, { useState, useEffect } from "react";
import { useSuiWallet } from "../hooks/useSuiWalletExtended";
import poolsApi from "../api/poolApi";

// Define types
interface Pool {
  id: string;
  name?: string;
  tokens?: string[];
  tvl: number;
  volume24h: number;
  apr: number;
  fees24h: number;
}

interface PoolStats {
  totalValueLocked: number;
  tradingVolume24h: number;
  activePools: number;
}

const PoolsPage: React.FC = () => {
  const currentDateTimeUTC = "2025-03-09 00:36:00";
  const currentUser = "jake1318";
  const { connected, address } = useSuiWallet();

  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string>("tvl");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [poolStats, setPoolStats] = useState<PoolStats>({
    totalValueLocked: 0,
    tradingVolume24h: 0,
    activePools: 8,
  });

  // Modal states for liquidity actions and pool creation
  const [showActionModal, setShowActionModal] = useState<boolean>(false);
  const [activePool, setActivePool] = useState<Pool | null>(null);
  const [actionType, setActionType] = useState<"deposit" | "withdraw" | null>(
    null
  );
  const [actionAmount, setActionAmount] = useState<string>("");
  const [selectedCoinType, setSelectedCoinType] = useState<string>("");

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newPoolName, setNewPoolName] = useState<string>("");
  const [newPoolAssets, setNewPoolAssets] = useState<
    Array<{
      coinType: string;
      weight: number;
      decimals: number;
      tradeFeeIn: number;
      initialDeposit: string;
    }>
  >([]);

  const sortPools = (
    poolsToSort: Pool[],
    column: string,
    direction: "asc" | "desc"
  ) => {
    return [...poolsToSort].sort((a, b) => {
      const aValue = (a as any)[column] || 0;
      const bValue = (b as any)[column] || 0;
      return direction === "asc" ? aValue - bValue : bValue - aValue;
    });
  };

  useEffect(() => {
    const fetchStaticPools = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const staticPools = await poolsApi.getStaticPoolsData();
        const sortedPools = sortPools(staticPools, sortColumn, sortDirection);
        setPools(sortedPools);
        const totalTVL = staticPools.reduce((sum, pool) => sum + pool.tvl, 0);
        const totalVolume = staticPools.reduce(
          (sum, pool) => sum + pool.volume24h,
          0
        );
        setPoolStats({
          totalValueLocked: totalTVL,
          tradingVolume24h: totalVolume,
          activePools: staticPools.length,
        });
      } catch (err: any) {
        console.error("Failed to fetch static pools:", err);
        setError("Failed to load pool data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStaticPools();
    const intervalId = setInterval(fetchStaticPools, 180000);
    return () => clearInterval(intervalId);
  }, [sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
    setPools(
      sortPools(pools, column, sortDirection === "asc" ? "desc" : "asc")
    );
  };

  const formatCurrency = (value: number) => {
    if (!value) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    if (!value) return "0.00%";
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  const openActionModal = (pool: Pool, type: "deposit" | "withdraw") => {
    setActivePool(pool);
    setActionType(type);
    setActionAmount("");
    setSelectedCoinType("");
    setShowActionModal(true);
  };

  const handleActionSubmit = async () => {
    if (!activePool || !actionType || !address) return;
    try {
      if (actionType === "deposit") {
        await poolsApi.depositLiquidity(
          activePool.id,
          selectedCoinType,
          actionAmount,
          address
        );
      } else {
        await poolsApi.withdrawLiquidity(
          activePool.id,
          selectedCoinType,
          actionAmount,
          address
        );
      }
      alert(
        `${
          actionType === "deposit" ? "Deposit" : "Withdrawal"
        } submitted successfully.`
      );
      setShowActionModal(false);
      // Refresh pool data if desired
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // For pool creation, we now separate the publish and create steps.
  // Step 1: Publish the LP coin
  const handlePublishLpCoin = async () => {
    if (!address) return;
    try {
      const publishResult = await poolsApi.publishLpCoin(address);
      // In production, the publishResult should include the LP coin type.
      // We then use that value to call the createPool endpoint.
      return publishResult.lpCoinType;
    } catch (err: any) {
      alert("Error publishing LP coin: " + err.message);
      throw err;
    }
  };

  // Step 2: Create pool (requires lpCoinType from publish)
  const handleCreatePool = async () => {
    if (!address || !newPoolName || newPoolAssets.length === 0) return;
    try {
      const lpCoinType = await handlePublishLpCoin();
      // Use production configuration for createPoolCapId from env
      const createPoolCapId = process.env.NEXT_PUBLIC_CREATE_POOL_CAP_ID;
      if (!lpCoinType || !createPoolCapId) {
        throw new Error(
          "Missing LP coin type or pool capability configuration."
        );
      }
      const poolDetails = {
        walletAddress: address,
        poolName: newPoolName,
        lpCoinType,
        assets: newPoolAssets,
        createPoolCapId,
      };
      const result = await poolsApi.createPool(poolDetails);
      alert("Pool created successfully.");
      setShowCreateModal(false);
      // Optionally refresh pool list
    } catch (err: any) {
      alert("Error creating pool: " + err.message);
    }
  };

  const openCreateModal = () => {
    setNewPoolName("");
    setNewPoolAssets([]);
    setShowCreateModal(true);
  };

  const addAssetField = () => {
    setNewPoolAssets([
      ...newPoolAssets,
      {
        coinType: "",
        weight: 0.5,
        decimals: 9,
        tradeFeeIn: 0.003,
        initialDeposit: "0",
      },
    ]);
  };

  return (
    <div className="pools-container">
      <header className="page-header">
        <div className="header-content">
          <h1>SUI AFTERMATH</h1>
          <nav className="main-nav">
            <a href="/">Home</a>
            <a href="/swap">Swap</a>
            <a href="/pools" className="active">
              Pools
            </a>
          </nav>
          <div className="wallet-info">
            {connected
              ? address?.substring(0, 4) +
                "..." +
                address?.substring(address.length - 4)
              : "Connect Wallet"}
          </div>
        </div>
      </header>

      <div className="date-display">
        {currentDateTimeUTC} UTC • User: {currentUser}
      </div>

      <div className="pools-content">
        <div className="user-address">
          {address ? (
            <h2>
              {address.substring(0, 6)}…{address.substring(address.length - 4)}
            </h2>
          ) : (
            <h2>Connect Wallet to View Your Pools</h2>
          )}
        </div>

        <h2>Liquidity Pools</h2>
        <div className="pool-actions">
          <button className="create-pool-btn" onClick={openCreateModal}>
            Create Pool
          </button>
        </div>

        <div className="stats-panels">
          <div className="stat-panel">
            <h3>Total Value Locked</h3>
            <p className="stat-value">
              {formatCurrency(poolStats.totalValueLocked)}
            </p>
          </div>
          <div className="stat-panel">
            <h3>24h Trading Volume</h3>
            <p className="stat-value">
              {formatCurrency(poolStats.tradingVolume24h)}
            </p>
          </div>
          <div className="stat-panel">
            <h3>Active Pools</h3>
            <p className="stat-value">{poolStats.activePools}</p>
          </div>
        </div>

        <div className="pools-table-container">
          {isLoading && <p className="loading">Loading pool data...</p>}
          {error && <p className="error-message">{error}</p>}
          {!isLoading && (
            <table className="pools-table">
              <thead>
                <tr>
                  <th>Pool</th>
                  <th
                    onClick={() => handleSort("tvl")}
                    className={
                      sortColumn === "tvl" ? `sorted ${sortDirection}` : ""
                    }
                  >
                    TVL{" "}
                    {sortColumn === "tvl" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("volume24h")}
                    className={
                      sortColumn === "volume24h"
                        ? `sorted ${sortDirection}`
                        : ""
                    }
                  >
                    24h Volume
                  </th>
                  <th
                    onClick={() => handleSort("apr")}
                    className={
                      sortColumn === "apr" ? `sorted ${sortDirection}` : ""
                    }
                  >
                    APR
                  </th>
                  <th
                    onClick={() => handleSort("fees24h")}
                    className={
                      sortColumn === "fees24h" ? `sorted ${sortDirection}` : ""
                    }
                  >
                    24h Fees
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pools.length > 0 ? (
                  pools.map((pool, index) => (
                    <tr key={pool.id || index} className="pool-row">
                      <td className="pool-tokens">
                        <div className="token-pair">{pool.name}</div>
                      </td>
                      <td className="pool-tvl">{formatCurrency(pool.tvl)}</td>
                      <td className="pool-volume">
                        {formatCurrency(pool.volume24h)}
                      </td>
                      <td className="pool-apr">{formatPercent(pool.apr)}</td>
                      <td className="pool-fees">
                        {formatCurrency(pool.fees24h)}
                      </td>
                      <td className="pool-actions">
                        <button
                          className="details-btn"
                          onClick={() => openActionModal(pool, "deposit")}
                        >
                          Deposit
                        </button>
                        <button
                          className="details-btn"
                          onClick={() => openActionModal(pool, "withdraw")}
                        >
                          Withdraw
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="no-pools">
                    <td colSpan={6}>No pools data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal for liquidity actions */}
      {showActionModal && activePool && actionType && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>
              {actionType === "deposit" ? "Add Liquidity" : "Remove Liquidity"}{" "}
              for {activePool.name}
            </h3>
            <label>
              Coin Type:
              <input
                type="text"
                value={selectedCoinType}
                onChange={(e) => setSelectedCoinType(e.target.value)}
                placeholder="e.g. 0x...::sui::SUI"
              />
            </label>
            <label>
              Amount:
              <input
                type="number"
                value={actionAmount}
                onChange={(e) => setActionAmount(e.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button onClick={handleActionSubmit}>Submit</button>
              <button onClick={() => setShowActionModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for creating a new pool */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Create New Pool</h3>
            <label>
              Pool Name:
              <input
                type="text"
                value={newPoolName}
                onChange={(e) => setNewPoolName(e.target.value)}
              />
            </label>
            <div>
              <h4>Assets</h4>
              {newPoolAssets.map((asset, idx) => (
                <div key={idx} className="asset-row">
                  <label>
                    Coin Type:
                    <input
                      type="text"
                      value={asset.coinType}
                      onChange={(e) => {
                        const assets = [...newPoolAssets];
                        assets[idx].coinType = e.target.value;
                        setNewPoolAssets(assets);
                      }}
                    />
                  </label>
                  <label>
                    Weight:
                    <input
                      type="number"
                      value={asset.weight}
                      onChange={(e) => {
                        const assets = [...newPoolAssets];
                        assets[idx].weight = parseFloat(e.target.value);
                        setNewPoolAssets(assets);
                      }}
                    />
                  </label>
                  <label>
                    Trade Fee:
                    <input
                      type="number"
                      value={asset.tradeFeeIn}
                      onChange={(e) => {
                        const assets = [...newPoolAssets];
                        assets[idx].tradeFeeIn = parseFloat(e.target.value);
                        setNewPoolAssets(assets);
                      }}
                    />
                  </label>
                  <label>
                    Initial Deposit:
                    <input
                      type="number"
                      value={asset.initialDeposit}
                      onChange={(e) => {
                        const assets = [...newPoolAssets];
                        assets[idx].initialDeposit = e.target.value;
                        setNewPoolAssets(assets);
                      }}
                    />
                  </label>
                </div>
              ))}
              <button onClick={addAssetField}>Add Asset</button>
            </div>
            <div className="modal-actions">
              <button onClick={handleCreatePool}>Create Pool</button>
              <button onClick={() => setShowCreateModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* (Your existing styles here, including modal styles) */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          background: #14152b;
          padding: 2rem;
          border-radius: 8px;
          max-width: 500px;
          width: 100%;
          color: #e4e7eb;
        }
        .modal label {
          display: block;
          margin-bottom: 1rem;
        }
        .modal input {
          width: 100%;
          padding: 0.5rem;
          margin-top: 0.5rem;
          border-radius: 4px;
          border: 1px solid #0df;
          background: #1b1c3a;
          color: #e4e7eb;
        }
        .modal-actions {
          margin-top: 1.5rem;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }
        .asset-row {
          border: 1px solid #0df;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default PoolsPage;
