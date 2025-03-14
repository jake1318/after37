import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import {
  ConnectButton as SuietConnectButton,
  useWallet as useSuietWallet,
} from "@suiet/wallet-kit";
import Logo from "../ui/Logo";
import { truncateAddress } from "../../utils/addressUtils";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const location = useLocation();

  // DappKit connection
  const currentAccount = useCurrentAccount();

  // Suiet connection
  const suietWallet = useSuietWallet();

  // Check if any wallet is connected
  const isDappKitConnected = !!currentAccount;
  const isSuietConnected = suietWallet.connected && !!suietWallet.account;
  const isAnyWalletConnected = isDappKitConnected || isSuietConnected;

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

  // Get the connected address from either wallet
  const getConnectedAddress = () => {
    if (isDappKitConnected) {
      return currentAccount.address;
    }
    if (isSuietConnected && suietWallet.account) {
      return suietWallet.account.address;
    }
    return null;
  };

  const connectedAddress = getConnectedAddress();

  // Handle disconnect for the active wallet
  const handleDisconnect = async () => {
    if (isSuietConnected) {
      await suietWallet.disconnect();
    }
    // Note: dapp-kit doesn't have a direct disconnect method
    setShowWalletOptions(false);
  };

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
              {connectedAddress && (
                <div className="address-display">
                  {truncateAddress(connectedAddress)}
                </div>
              )}
              <div className="button-wrapper">
                {isAnyWalletConnected ? (
                  <button
                    className="disconnect-wallet-btn"
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </button>
                ) : showWalletOptions ? (
                  <div className="wallet-options">
                    <div className="wallet-option">
                      <ConnectButton connectText="Sui Wallet" />
                    </div>
                    <div className="wallet-option">
                      <SuietConnectButton>Suiet Wallet</SuietConnectButton>
                    </div>
                    <button
                      className="back-btn"
                      onClick={() => setShowWalletOptions(false)}
                    >
                      Back
                    </button>
                  </div>
                ) : (
                  <button
                    className="connect-wallet-btn"
                    onClick={() => setShowWalletOptions(true)}
                  >
                    Connect Wallet
                  </button>
                )}
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
        
        /* Our custom wallet dropdown menu */
        .connect-wallet-btn {
          background-color: rgba(0, 221, 255, 0.1);
          border: 1px solid rgba(0, 221, 255, 0.3);
          color: #0df;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .connect-wallet-btn:hover {
          background-color: rgba(0, 221, 255, 0.2);
          box-shadow: 0 0 10px rgba(0, 221, 255, 0.3);
        }

        .disconnect-wallet-btn {
          background-color: rgba(255, 70, 70, 0.1);
          border: 1px solid rgba(255, 70, 70, 0.3);
          color: #ff4646;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .disconnect-wallet-btn:hover {
          background-color: rgba(255, 70, 70, 0.2);
          box-shadow: 0 0 10px rgba(255, 70, 70, 0.3);
        }
        
        .wallet-options {
          position: absolute;
          right: 0;
          top: calc(100% + 10px);
          background-color: rgba(6, 7, 20, 0.95);
          border: 1px solid rgba(0, 221, 255, 0.3);
          border-radius: 8px;
          padding: 16px;
          min-width: 220px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
        }
        
        .wallet-option {
          margin-bottom: 10px;
        }
        
        .back-btn {
          width: 100%;
          background-color: rgba(155, 155, 155, 0.1);
          border: 1px solid rgba(155, 155, 155, 0.3);
          color: #9baacf;
          padding: 8px;
          border-radius: 8px;
          margin-top: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .back-btn:hover {
          background-color: rgba(155, 155, 155, 0.2);
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
          width: 100% !important;
          text-align: center !important;
        }
        
        :global(.sui-connect-button:hover) {
          background-color: rgba(0, 221, 255, 0.2) !important;
          box-shadow: 0 0 10px rgba(0, 221, 255, 0.3) !important;
        }
        
        /* Style Suiet wallet button */
        :global(.suiet-wallet-kit-button) {
          background-color: rgba(0, 221, 255, 0.1) !important;
          border: 1px solid rgba(0, 221, 255, 0.3) !important;
          color: #0df !important;
          padding: 8px 16px !important;
          border-radius: 8px !important;
          font-weight: 500 !important;
          transition: all 0.3s ease !important;
          cursor: pointer !important;
          width: 100% !important;
          text-align: center !important;
        }
        
        :global(.suiet-wallet-kit-button:hover) {
          background-color: rgba(0, 221, 255, 0.2) !important;
          box-shadow: 0 0 10px rgba(0, 221, 255, 0.3) !important;
        }
      `}</style>
    </header>
  );
};

export default Header;
