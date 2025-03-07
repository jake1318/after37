import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import StatCard from "../components/ui/StatCard";
import Card from "../components/ui/Card";
import LoadingState from "../components/ui/LoadingState";
import { formatCurrency, formatPercentage } from "../utils/formatters";
import { poolsApi, swapApi } from "../api/api";
import { Pool } from "../types/api";

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [topPools, setTopPools] = useState<Pool[]>([]);
  const [stats, setStats] = useState({
    tvl: 0,
    volume24h: 0,
    poolsCount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all pools
        const pools = await poolsApi.getAllPools();
        setTopPools(pools.slice(0, 3)); // Get top 3 pools

        // Get 24h volume
        const volume24h = await swapApi.getVolume24h();

        // Calculate total TVL and pool count
        const tvl = pools.reduce((acc, pool) => acc + pool.tvl, 0);

        setStats({
          tvl,
          volume24h,
          poolsCount: pools.length,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingState text="Loading DeFi data..." />;
  }

  return (
    <div className="home-page">
      <div className="container">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Next-Gen DeFi on <span className="highlight">Sui</span>
            </h1>
            <p className="hero-subtitle">
              Trade, provide liquidity, and earn yield with the most advanced
              decentralized exchange on Sui blockchain.
            </p>
            <div className="hero-cta">
              <Link to="/swap">
                <Button variant="primary" size="lg">
                  Start Trading
                </Button>
              </Link>
              <Link to="/pools">
                <Button variant="outline" size="lg">
                  Explore Pools
                </Button>
              </Link>
            </div>
          </div>
          <div className="hero-graphic"></div>
        </section>

        <section className="stats-section">
          <div className="stats-grid">
            <StatCard
              title="Total Value Locked"
              value={formatCurrency(stats.tvl)}
              subValue="Across all pools"
              variant="primary"
            />
            <StatCard
              title="24h Trading Volume"
              value={formatCurrency(stats.volume24h)}
              change={{ value: 12.5, isPositive: true }}
              variant="secondary"
            />
            <StatCard
              title="Active Pools"
              value={stats.poolsCount}
              variant="tertiary"
            />
          </div>
        </section>

        <section className="features-section">
          <h2 className="section-title">Core Features</h2>

          <div className="features-grid">
            <Card className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Lightning Fast Swaps</h3>
              <p className="feature-description">
                Execute trades in milliseconds with near-instant finality on the
                Sui blockchain.
              </p>
            </Card>

            <Card className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Enhanced Security</h3>
              <p className="feature-description">
                Built with Sui Move, a safe and expressive language designed for
                secure digital asset management.
              </p>
            </Card>

            <Card className="feature-card">
              <div className="feature-icon">💰</div>
              <h3 className="feature-title">DCA Trading</h3>
              <p className="feature-description">
                Automate your investment strategy with dollar-cost averaging for
                smarter, stress-free trading.
              </p>
            </Card>
          </div>
        </section>

        <section className="top-pools-section">
          <div className="section-header">
            <h2 className="section-title">Top Pools</h2>
            <Link to="/pools">
              <Button variant="outline" size="sm">
                View All Pools
              </Button>
            </Link>
          </div>

          <div className="pools-grid">
            {topPools.map((pool) => (
              <Link to={`/pools/${pool.id}`} key={pool.id}>
                <Card className="pool-card">
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
                  <h3 className="pool-name">{pool.name}</h3>
                  <div className="pool-stats">
                    <div className="pool-stat-item">
                      <div className="stat-label">TVL</div>
                      <div className="stat-value">
                        {formatCurrency(pool.tvl)}
                      </div>
                    </div>
                    <div className="pool-stat-item">
                      <div className="stat-label">APR</div>
                      <div className="stat-value highlight">
                        {formatPercentage(pool.apr)}
                      </div>
                    </div>
                    <div className="pool-stat-item">
                      <div className="stat-label">24h Volume</div>
                      <div className="stat-value">
                        {formatCurrency(pool.volume24h)}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">
              Ready to dive into the future of DeFi?
            </h2>
            <p className="cta-description">
              Connect your wallet and start trading on the most innovative DEX
              on Sui.
            </p>
            <Link to="/swap">
              <Button variant="primary" size="lg">
                Launch App
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        .home-page {
          padding: 0;
        }

        .hero-section {
          display: flex;
          align-items: center;
          min-height: calc(100vh - 160px);
          padding: 6rem 0;
          position: relative;
          overflow: hidden;
        }

        .hero-content {
          max-width: 600px;
          position: relative;
          z-index: 2;
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          line-height: 1.2;
          font-family: "Orbitron", sans-serif;
          text-shadow: 0 0 20px rgba(0, 221, 255, 0.5);
        }

        .hero-title .highlight {
          color: #0df;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          margin-bottom: 2.5rem;
          color: #9baacf;
          line-height: 1.6;
        }

        .hero-cta {
          display: flex;
          gap: 1rem;
        }

        .hero-graphic {
          position: absolute;
          top: 50%;
          right: 0;
          transform: translateY(-50%);
          width: 50%;
          height: 80%;
          background-image: radial-gradient(
            circle at center,
            rgba(0, 221, 255, 0.15),
            transparent 70%
          );
          z-index: 1;
        }

        .stats-section {
          padding: 2rem 0 4rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .section-title {
          font-size: 2rem;
          margin-bottom: 2rem;
          font-family: "Orbitron", sans-serif;
          position: relative;
          display: inline-block;
        }

        .section-title::after {
          content: "";
          position: absolute;
          bottom: -10px;
          left: 0;
          width: 60px;
          height: 3px;
          background: #0df;
          box-shadow: 0 0 10px rgba(0, 221, 255, 0.5);
        }

        .features-section {
          padding: 4rem 0;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }

        .feature-card {
          height: 100%;
        }

        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
        }

        .feature-title {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          font-family: "Orbitron", sans-serif;
        }

        .feature-description {
          color: #9baacf;
          line-height: 1.6;
        }

        .top-pools-section {
          padding: 4rem 0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .pools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2rem;
        }

        .pool-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .pool-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(0, 221, 255, 0.2);
        }

        .pool-tokens {
          display: flex;
          margin-bottom: 1rem;
        }

        .token-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid rgba(20, 21, 43, 0.8);
          margin-right: -8px;
          position: relative;
        }

        .pool-name {
          font-size: 1.25rem;
          margin-bottom: 1rem;
        }

        .pool-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .pool-stat-item {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #5d6785;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-family: "Share Tech Mono", monospace;
          font-weight: 500;
        }

        .stat-value.highlight {
          color: #0f6;
        }

        .cta-section {
          background: linear-gradient(
            180deg,
            rgba(10, 11, 26, 0) 0%,
            rgba(20, 21, 43, 0.8) 100%
          );
          padding: 6rem 0;
          margin-top: 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .cta-section::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(0, 221, 255, 0.5),
            transparent
          );
        }

        .cta-content {
          max-width: 700px;
          margin: 0 auto;
        }

        .cta-title {
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
          font-family: "Orbitron", sans-serif;
        }

        .cta-description {
          font-size: 1.25rem;
          color: #9baacf;
          margin-bottom: 2rem;
        }

        @media (max-width: 768px) {
          .hero-section {
            flex-direction: column;
            padding: 4rem 0;
          }

          .hero-content {
            text-align: center;
          }

          .hero-title {
            font-size: 2.5rem;
          }

          .hero-cta {
            justify-content: center;
          }

          .hero-graphic {
            position: relative;
            width: 100%;
            height: 300px;
            transform: none;
            top: 0;
            margin-top: 3rem;
          }

          .section-title {
            font-size: 1.75rem;
          }

          .cta-title {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
