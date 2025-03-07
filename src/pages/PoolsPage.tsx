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
  const [sortBy, setSortBy] = useState<"tvl" | "apr" | "volume24h">("tvl");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Stats
  const [totalTvl, setTotalTvl] = useState<number>(0);
  const [totalVolume24h, setTotalVolume24h] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all pools
        const poolsData = await poolsApi.getAllPools();
        setPools(poolsData);

        // Calculate total TVL and 24h volume
        const tvl = poolsData.reduce((sum, pool) => sum + pool.tvl, 0);
        const volume24h = poolsData.reduce(
          (sum, pool) => sum + pool.volume24h,
          0
        );

        setTotalTvl(tvl);
        setTotalVolume24h(volume24h);
      } catch (error) {
        console.error("Error fetching pools:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
          />

          <StatCard
            title="24h Trading Volume"
            value={formatCurrency(totalVolume24h)}
            variant="secondary"
          />

          <StatCard
            title="Active Pools"
            value={pools.length}
            variant="tertiary"
          />
        </div>

        <Card>
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
                      <div className="table-value">
                        {formatCurrency(pool.tvl)}
                      </div>
                    </td>
                    <td>
                      <div className="table-value">
                        {formatCurrency(pool.volume24h)}
                      </div>
                    </td>
                    <td>
                      <div className="table-value highlight">
                        {formatPercentage(pool.apr)}
                      </div>
                    </td>
                    <td>
                      <div className="table-value">
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
      `}</style>
    </div>
  );
};

export default PoolsPage;
