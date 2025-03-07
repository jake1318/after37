import React from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";

const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-page">
      <div className="container">
        <div className="not-found-content">
          <div className="error-code">404</div>
          <h1 className="error-title">Page Not Found</h1>
          <p className="error-message">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="action-buttons">
            <Link to="/">
              <Button variant="primary" size="lg">
                Go Home
              </Button>
            </Link>
            <Link to="/swap">
              <Button variant="outline" size="lg">
                Go to Swap
              </Button>
            </Link>
          </div>
        </div>

        <div className="cyberpunk-graphic">
          <div className="glitch-effect"></div>
        </div>
      </div>

      <style jsx>{`
        .not-found-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 160px);
          padding: 2rem 0;
          position: relative;
          overflow: hidden;
        }

        .not-found-content {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .error-code {
          font-size: 8rem;
          font-weight: 700;
          line-height: 1;
          background: linear-gradient(90deg, #0df, #f0c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-family: "Orbitron", sans-serif;
          margin-bottom: 1rem;
          text-shadow: 0 0 30px rgba(0, 221, 255, 0.6);
          position: relative;
        }

        .error-code::before {
          content: "404";
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, #f0c, #0df);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          opacity: 0.5;
          animation: glitch 3s infinite;
        }

        @keyframes glitch {
          0% {
            transform: translate(0);
          }
          20% {
            transform: translate(-3px, 3px);
          }
          40% {
            transform: translate(-3px, -3px);
          }
          60% {
            transform: translate(3px, 3px);
          }
          80% {
            transform: translate(3px, -3px);
          }
          100% {
            transform: translate(0);
          }
        }

        .error-title {
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
          font-family: "Orbitron", sans-serif;
        }

        .error-message {
          font-size: 1.25rem;
          color: #9baacf;
          margin-bottom: 2.5rem;
          line-height: 1.6;
        }

        .action-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        .cyberpunk-graphic {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
          pointer-events: none;
        }

        .glitch-effect {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          height: 500px;
          background: radial-gradient(
            circle,
            rgba(0, 221, 255, 0.1) 0%,
            transparent 70%
          );
          opacity: 0.8;
        }

        .glitch-effect::before {
          content: "";
          position: absolute;
          top: 45%;
          left: -50%;
          right: -50%;
          height: 1px;
          background: linear-gradient(90deg, transparent, #0df, transparent);
          animation: scanline 3s infinite linear;
        }

        @keyframes scanline {
          0% {
            top: 0%;
          }
          100% {
            top: 100%;
          }
        }

        @media (max-width: 768px) {
          .error-code {
            font-size: 5rem;
          }

          .error-title {
            font-size: 2rem;
          }

          .error-message {
            font-size: 1rem;
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;
