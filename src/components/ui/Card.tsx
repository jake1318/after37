import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  title?: string | ReactNode;
  className?: string;
  footer?: ReactNode;
  variant?: "default" | "primary" | "secondary" | "tertiary";
  glow?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = "",
  footer,
  variant = "default",
  glow = false,
  onClick,
}) => {
  return (
    <div
      className={`card card-${variant} ${glow ? "card-glow" : ""} ${className}`}
      onClick={onClick}
    >
      {title && (
        <div className="card-header">
          {typeof title === "string" ? <h3>{title}</h3> : title}
        </div>
      )}

      <div className="card-content">{children}</div>

      {footer && <div className="card-footer">{footer}</div>}

      <style jsx>{`
        .card {
          background: linear-gradient(
            145deg,
            rgba(20, 21, 43, 0.8),
            rgba(10, 11, 26, 0.8)
          );
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          transition: all 0.3s ease;
        }

        .card::before {
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

        .card-primary::before {
          background: linear-gradient(90deg, transparent, #0df, transparent);
        }

        .card-secondary::before {
          background: linear-gradient(90deg, transparent, #f0c, transparent);
        }

        .card-tertiary::before {
          background: linear-gradient(90deg, transparent, #0f6, transparent);
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
        }

        .card-glow:hover {
          box-shadow: 0 6px 24px rgba(0, 221, 255, 0.3);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .card-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          text-shadow: 0 0 5px rgba(0, 221, 255, 0.5);
          font-family: "Orbitron", sans-serif;
        }

        .card-content {
          margin-bottom: 0.5rem;
        }

        .card-footer {
          border-top: 1px solid rgba(155, 170, 207, 0.1);
          padding-top: 1rem;
          margin-top: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          color: #9baacf;
        }

        /* Variants */
        .card-primary {
          border-left: 2px solid #0df;
        }

        .card-secondary {
          border-left: 2px solid #f0c;
        }

        .card-tertiary {
          border-left: 2px solid #0f6;
        }
      `}</style>
    </div>
  );
};

export default Card;
