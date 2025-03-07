import React, { ReactNode } from "react";
import Card from "./Card";

interface StatCardProps {
  title: string;
  value: string | number | ReactNode;
  subValue?: string;
  icon?: ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  variant?: "default" | "primary" | "secondary" | "tertiary";
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  icon,
  change,
  loading = false,
  variant = "default",
}) => {
  return (
    <Card variant={variant}>
      <div className="stat-card">
        <div className="stat-header">
          <div className="stat-title">{title}</div>
          {icon && <div className="stat-icon">{icon}</div>}
        </div>

        <div className="stat-value-container">
          {loading ? (
            <div className="stat-loading-placeholder" />
          ) : (
            <div className="stat-value">{value}</div>
          )}
        </div>

        <div className="stat-footer">
          {subValue && <div className="stat-sub-value">{subValue}</div>}

          {change && (
            <div
              className={`stat-change ${
                change.isPositive ? "positive" : "negative"
              }`}
            >
              {change.isPositive ? "↗" : "↘"} {Math.abs(change.value)}%
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .stat-card {
          min-height: 120px;
          display: flex;
          flex-direction: column;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .stat-title {
          color: #9baacf;
          font-size: 0.875rem;
          font-family: "Orbitron", sans-serif;
          letter-spacing: 0.5px;
        }

        .stat-icon {
          font-size: 1.25rem;
          color: #5d6785;
        }

        .stat-value-container {
          margin-bottom: 0.75rem;
          min-height: 2.5rem;
          display: flex;
          align-items: center;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: bold;
          font-family: "Share Tech Mono", monospace;
          line-height: 1.2;
          background: linear-gradient(90deg, #fff, #9baacf);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .stat-loading-placeholder {
          width: 80%;
          height: 2rem;
          background: linear-gradient(
            90deg,
            rgba(93, 103, 133, 0.2),
            rgba(93, 103, 133, 0.3),
            rgba(93, 103, 133, 0.2)
          );
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 4px;
        }

        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .stat-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }

        .stat-sub-value {
          color: #5d6785;
          font-size: 0.875rem;
        }

        .stat-change {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .stat-change.positive {
          background-color: rgba(0, 255, 102, 0.1);
          color: #0f6;
        }

        .stat-change.negative {
          background-color: rgba(255, 59, 92, 0.1);
          color: #ff3b5c;
        }
      `}</style>
    </Card>
  );
};

export default StatCard;
