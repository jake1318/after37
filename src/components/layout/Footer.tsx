import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-left">
            <div className="footer-logo">
              <span className="logo-text">
                SUI <span className="highlight">AFTERMATH</span>
              </span>
            </div>
            <p className="footer-tagline">
              Futuristic DeFi on the Sui blockchain
            </p>
          </div>

          <div className="footer-links">
            <div className="links-column">
              <h4 className="column-title">Navigation</h4>
              <ul>
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <Link to="/swap">Swap</Link>
                </li>
                <li>
                  <Link to="/pools">Pools</Link>
                </li>
              </ul>
            </div>

            <div className="links-column">
              <h4 className="column-title">Resources</h4>
              <ul>
                <li>
                  <a
                    href="https://docs.aftermath.finance/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Docs
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/aftermath-finance"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://sui.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Sui Blockchain
                  </a>
                </li>
              </ul>
            </div>

            <div className="links-column">
              <h4 className="column-title">Community</h4>
              <ul>
                <li>
                  <a
                    href="https://twitter.com/aftermath_fi"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="https://discord.gg/aftermath"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a
                    href="https://t.me/aftermath_fi"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Telegram
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="copyright">
            &copy; {new Date().getFullYear()} Sui Aftermath. All rights
            reserved.
          </div>
          <div className="network-status">
            <span className="network-indicator">●</span>
            Connected to Sui Mainnet
          </div>
        </div>
      </div>

      <style jsx>{`
        .app-footer {
          background: rgba(10, 11, 26, 0.9);
          padding: 3rem 0 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .app-footer::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #0df, transparent);
        }

        .footer-content {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          margin-bottom: 3rem;
        }

        .footer-left {
          max-width: 300px;
        }

        .footer-logo {
          margin-bottom: 1rem;
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: bold;
          font-family: "Orbitron", sans-serif;
          letter-spacing: 1px;
          color: #fff;
          text-shadow: 0 0 10px rgba(0, 221, 255, 0.5);
        }

        .logo-text .highlight {
          color: #0df;
        }

        .footer-tagline {
          color: #9baacf;
          line-height: 1.5;
        }

        .footer-links {
          display: flex;
          gap: 3rem;
        }

        .links-column {
          min-width: 120px;
        }

        .column-title {
          color: #fff;
          font-size: 1rem;
          margin-bottom: 1rem;
          position: relative;
          font-family: "Orbitron", sans-serif;
          letter-spacing: 1px;
        }

        .column-title::after {
          content: "";
          position: absolute;
          bottom: -5px;
          left: 0;
          width: 30px;
          height: 2px;
          background: #0df;
          box-shadow: 0 0 10px rgba(0, 221, 255, 0.5);
        }

        .links-column ul {
          padding: 0;
        }

        .links-column li {
          margin-bottom: 0.5rem;
        }

        .links-column a {
          color: #9baacf;
          transition: all 0.3s ease;
        }

        .links-column a:hover {
          color: #0df;
          text-shadow: 0 0 10px rgba(0, 221, 255, 0.5);
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: #9baacf;
          font-size: 0.875rem;
        }

        .network-status {
          display: flex;
          align-items: center;
        }

        .network-indicator {
          color: #0f6;
          margin-right: 0.5rem;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.5;
          }
        }

        @media (max-width: 768px) {
          .footer-content {
            flex-direction: column;
          }

          .footer-left {
            margin-bottom: 2rem;
            max-width: 100%;
          }

          .footer-links {
            width: 100%;
            flex-wrap: wrap;
            gap: 2rem;
          }

          .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
          }

          .copyright {
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
