import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import StatCard from "../components/ui/StatCard";
import LoadingState from "../components/ui/LoadingState";
import { poolsApi } from "../api/api";
import { Pool } from "../types/api";
import { formatCurrency, formatPercentage } from "../utils/formatters";

const PoolsPage: React.FC = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"tvl" | "apr" | "volume24h">("tvl");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Stats
  const [totalTvl, setTotalTvl] = useState<number>(0);
  const [totalVolume24h, setTotalVolume24h] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all pools (without stats)
        const poolsData = await poolsApi.getAllPools();
        setPools(poolsData);

        // Show pools immediately for better UX
        setLoading(false);

        // Now fetch stats in the background
        setLoadingStats(true);

        // Get stats in batches to avoid timeouts
        await fetchPoolStatsInBatches(poolsData);
      } catch (error) {
        console.error("Error fetching pools:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to fetch stats in smaller batches
  const fetchPoolStatsInBatches = async (poolsData: Pool[]) => {
    try {
      const BATCH_SIZE = 10; // Process 10 pools at a time

      for (let i = 0; i < poolsData.length; i += BATCH_SIZE) {
        const batchPools = poolsData.slice(i, i + BATCH_SIZE);
        const batchIds = batchPools.map((pool) => pool.id);

        // Fetch stats for this batch
        const batchStats = await poolsApi.getBatchPoolStats(batchIds);

        if (batchStats && batchStats.length > 0) {
          // Update pools with new stats
          setPools((currentPools) => {
            const updatedPools = [...currentPools];

            batchStats.forEach((stat) => {
              if (!stat || !stat.id) return;

              const poolIndex = updatedPools.findIndex((p) => p.id === stat.id);
              if (poolIndex !== -1) {
                updatedPools[poolIndex] = {
                  ...updatedPools[poolIndex],
                  tvl: stat.tvl || updatedPools[poolIndex].tvl || 0,
                  volume24h:
                    stat.volume24h || updatedPools[poolIndex].volume24h || 0,
                  apr: stat.apr || updatedPools[poolIndex].apr || 0,
                  fees24h: stat.fees24h || updatedPools[poolIndex].fees24h || 0,
                };
              }
            });

            // Recalculate totals
            const tvl = updatedPools.reduce((sum, pool) => sum + pool.tvl, 0);
            const volume24h = updatedPools.reduce(
              (sum, pool) => sum + pool.volume24h,
              0
            );

            setTotalTvl(tvl);
            setTotalVolume24h(volume24h);

            return updatedPools;
          });
        }

        // Small delay between batches to avoid overwhelming the API
        if (i + BATCH_SIZE < poolsData.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error("Error fetching pool stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Sort pools
  const sortedPools = [...pools].sort((a, b) => {
    const factor = sortDirection === "desc" ? -1 : 1;
    return (a[sortBy] - b[sortBy]) * factor;
  });

  const handleSort = (field: "tvl" | "apr" | "volume24h") => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  if (loading) {
    return <LoadingState text="Loading pools data..." />;
  }

  return (
    <div className="pools-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Liquidity Pools</h1>
          <Button variant="primary">Create Pool</Button>
        </div>

        <div className="pools-stats">
          <StatCard
            title="Total Value Locked"
            value={formatCurrency(totalTvl)}
            variant="primary"
            loading={loadingStats}
          />

          <StatCard
            title="24h Trading Volume"
            value={formatCurrency(totalVolume24h)}
            variant="secondary"
            loading={loadingStats}
          />

          <StatCard
            title="Active Pools"
            value={pools.length}
            variant="tertiary"
          />
        </div>

        <Card>
          {loadingStats && (
            <div className="loading-stats-indicator">
              Loading pool statistics...
            </div>
          )}
          <div className="pools-table-wrapper">
            <table className="pools-table">
              <thead>
                <tr>
                  <th>Pool</th>
                  <th
                    className={`sortable ${sortBy === "tvl" ? "active" : ""}`}
                    onClick={() => handleSort("tvl")}
                  >
                    TVL
                    <span className="sort-icon">
                      {sortBy === "tvl" &&
                        (sortDirection === "desc" ? "↓" : "↑")}
                    </span>
                  </th>
                  <th
                    className={`sortable ${
                      sortBy === "volume24h" ? "active" : ""
                    }`}
                    onClick={() => handleSort("volume24h")}
                  >
                    24h Volume
                    <span className="sort-icon">
                      {sortBy === "volume24h" &&
                        (sortDirection === "desc" ? "↓" : "↑")}
                    </span>
                  </th>
                  <th
                    className={`sortable ${sortBy === "apr" ? "active" : ""}`}
                    onClick={() => handleSort("apr")}
                  >
                    APR
                    <span className="sort-icon">
                      {sortBy === "apr" &&
                        (sortDirection === "desc" ? "↓" : "↑")}
                    </span>
                  </th>
                  <th>24h Fees</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPools.map((pool) => (
                  <tr key={pool.id}>
                    <td>
                      <div className="pool-info">
                        <div className="pool-tokens">
                          {pool.tokens.map((token, index) => (
                            <div
                              key={index}
                              className="token-icon"
                              style={{
                                backgroundImage: `url(https://sui-icons.vercel.app/coins/${token.symbol.toLowerCase()}.png)`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                zIndex: pool.tokens.length - index,
                              }}
                            />
                          ))}
                        </div>
                        <div className="pool-name">{pool.name}</div>
                      </div>
                    </td>
                    <td>
                      <div
                        className={`table-value ${
                          loadingStats ? "shimmer" : ""
                        }`}
                      >
                        {formatCurrency(pool.tvl)}
                      </div>
                    </td>
                    <td>
                      <div
                        className={`table-value ${
                          loadingStats ? "shimmer" : ""
                        }`}
                      >
                        {formatCurrency(pool.volume24h)}
                      </div>
                    </td>
                    <td>
                      <div
                        className={`table-value highlight ${
                          loadingStats ? "shimmer" : ""
                        }`}
                      >
                        {formatPercentage(pool.apr)}
                      </div>
                    </td>
                    <td>
                      <div
                        className={`table-value ${
                          loadingStats ? "shimmer" : ""
                        }`}
                      >
                        {formatCurrency(pool.fees24h)}
                      </div>
                    </td>
                    <td>
                      <div className="actions">
                        <Link to={`/pools/${pool.id}`}>
                          <Button variant="outline" size="sm">
                            Details
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}

                {pools.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      No liquidity pools found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <style jsx>{`
        .pools-page {
          padding: 2rem 0;
          min-height: calc(100vh - 160px);
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .page-title {
          font-size: 2rem;
          margin: 0;
          font-family: "Orbitron", sans-serif;
          position: relative;
          display: inline-block;
        }

        .page-title::after {
          content: "";
          position: absolute;
          bottom: -8px;
          left: 0;
          width: 40px;
          height: 3px;
          background: #0df;
          box-shadow: 0 0 8px rgba(0, 221, 255, 0.5);
        }

        .pools-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .pools-table-wrapper {
          overflow-x: auto;
        }

        .pools-table {
          width: 100%;
          border-collapse: collapse;
        }

        .pools-table th,
        .pools-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid rgba(155, 170, 207, 0.1);
        }

        .pools-table th {
          color: #9baacf;
          font-weight: 500;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .pools-table th.sortable {
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .pools-table th.sortable:hover,
        .pools-table th.active {
          color: #fff;
        }

        .sort-icon {
          margin-left: 0.5rem;
        }

        .pool-info {
          display: flex;
          align-items: center;
        }

        .pool-tokens {
          display: flex;
          margin-right: 1rem;
        }

        .token-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid rgba(20, 21, 43, 0.8);
          margin-right: -8px;
          position: relative;
        }

        .pool-name {
          font-weight: 500;
        }

        .table-value {
          font-family: "Share Tech Mono", monospace;
        }

        .table-value.highlight {
          color: #0f6;
        }

        .actions {
          display: flex;
          gap: 0.5rem;
        }

        .empty-state {
          text-align: center;
          color: #5d6785;
          padding: 3rem 0;
        }

        .loading-stats-indicator {
          padding: 0.5rem;
          text-align: center;
          color: #9baacf;
          font-size: 0.875rem;
          background-color: rgba(0, 221, 255, 0.1);
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .shimmer {
          position: relative;
          overflow: hidden;
        }

        .shimmer::after {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.05) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default PoolsPage;
