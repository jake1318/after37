import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import Logo from "../ui/Logo";
import { truncateAddress } from "../../utils/addressUtils";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const currentAccount = useCurrentAccount();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Swap", path: "/swap" },
    { name: "Pools", path: "/pools" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`app-header ${isScrolled ? "scrolled" : ""}`}>
      <div className="container">
        <div className="header-content">
          <div className="header-left">
            <Link to="/" className="logo-link">
              <Logo />
            </Link>
          </div>

          <nav className="main-nav">
            <ul className="nav-list">
              {navItems.map((item) => (
                <li key={item.path} className="nav-item">
                  <Link
                    to={item.path}
                    className={`nav-link ${
                      location.pathname === item.path ? "active" : ""
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-right">
            <div className="wallet-status">
              {currentAccount?.address && (
                <div className="address-display">
                  {truncateAddress(currentAccount.address)}
                </div>
              )}
              <div className="button-wrapper">
                <ConnectButton connectText="Connect Wallet" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .app-header {
          padding: 1rem 0;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          transition: all 0.3s ease;
          background: rgba(6, 7, 20, 0.8);
          backdrop-filter: blur(10px);
        }

        .app-header.scrolled {
          box-shadow: 0 0 20px rgba(0, 221, 255, 0.2);
          background: rgba(6, 7, 20, 0.95);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo-link {
          display: flex;
          align-items: center;
          font-size: 1.5rem;
          font-weight: bold;
          color: #fff;
          text-shadow: 0 0 10px rgba(0, 221, 255, 0.7);
        }

        .main-nav {
          margin-left: 3rem;
        }

        .nav-list {
          display: flex;
          list-style: none;
          gap: 2rem;
        }

        .nav-link {
          color: #9baacf;
          position: relative;
          padding: 0.5rem 0;
          transition: all 0.3s ease;
          font-family: "Orbitron", sans-serif;
          letter-spacing: 1px;
        }

        .nav-link.active {
          color: #0df;
          text-shadow: 0 0 10px rgba(0, 221, 255, 0.5);
        }

        .nav-link::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #0df, transparent);
          transition: width 0.3s ease;
        }

        .nav-link.active::after,
        .nav-link:hover::after {
          width: 100%;
        }

        .wallet-status {
          display: flex;
          align-items: center;
        }

        .address-display {
          margin-right: 1rem;
          padding: 0.5rem;
          background: rgba(10, 11, 26, 0.5);
          border-radius: 4px;
          color: #9baacf;
          font-family: "Share Tech Mono", monospace;
        }
        
        /* Wrapper to modify the z-index context for the button */
        .button-wrapper {
          position: relative;
          z-index: 1001;
        }
        
        /* Style the connect button from dapp-kit */
        :global(.sui-connect-button) {
          background-color: rgba(0, 221, 255, 0.1) !important;
          border: 1px solid rgba(0, 221, 255, 0.3) !important;
          color: #0df !important;
          padding: 8px 16px !important;
          border-radius: 8px !important;
          font-weight: 500 !important;
          transition: all 0.3s ease !important;
          cursor: pointer !important;
        }
        
        :global(.sui-connect-button:hover) {
          background-color: rgba(0, 221, 255, 0.2) !important;
          box-shadow: 0 0 10px rgba(0, 221, 255, 0.3) !important;
        }
      `}</style>
    </header>
  );
};

export default Header;
