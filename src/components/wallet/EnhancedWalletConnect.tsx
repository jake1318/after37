import React, { useState } from "react";
import {
  ConnectButton as DappKitConnectButton,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import {
  ConnectButton as SuietConnectButton,
  useWallet as useSuietWallet,
} from "@suiet/wallet-kit";
import { truncateAddress } from "../../utils/addressUtils";
import "./EnhancedWalletConnect.css";

interface EnhancedWalletConnectProps {
  className?: string;
}

export const EnhancedWalletConnect: React.FC<EnhancedWalletConnectProps> = ({
  className = "",
}) => {
  const [activeWallet, setActiveWallet] = useState<"dappkit" | "suiet" | null>(
    null
  );
  const [showWalletOptions, setShowWalletOptions] = useState(false);

  // DappKit connection
  const dappKitAccount = useCurrentAccount();

  // Suiet connection
  const suietWallet = useSuietWallet();

  // Check if any wallet is connected
  const isDappKitConnected = !!dappKitAccount;
  const isSuietConnected = suietWallet.connected;
  const isAnyWalletConnected = isDappKitConnected || isSuietConnected;

  // Get the active wallet's address
  const getConnectedAddress = () => {
    if (isDappKitConnected) {
      return truncateAddress(dappKitAccount.address);
    }
    if (isSuietConnected && suietWallet.account) {
      return truncateAddress(suietWallet.account.address);
    }
    return null;
  };

  const connectedAddress = getConnectedAddress();

  // Handle disconnect for the active wallet
  const handleDisconnect = async () => {
    if (isSuietConnected) {
      await suietWallet.disconnect();
    }
    setActiveWallet(null);
    setShowWalletOptions(false);
  };

  // Display the connected wallet or options to connect
  if (isAnyWalletConnected) {
    return (
      <div className={`enhanced-wallet-container ${className}`}>
        <div className="connected-wallet">
          <span className="wallet-address">{connectedAddress}</span>
          <button className="disconnect-btn" onClick={handleDisconnect}>
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`enhanced-wallet-container ${className}`}>
      {showWalletOptions ? (
        <div className="wallet-options">
          <div className="wallet-option">
            <DappKitConnectButton
              connectText="Use Sui Wallet"
              className="dappkit-connect-btn"
              onComplete={() => {
                setActiveWallet("dappkit");
                setShowWalletOptions(false);
              }}
            />
          </div>
          <div className="wallet-option">
            <SuietConnectButton
              className="suiet-connect-btn"
              onConnectSuccess={() => {
                setActiveWallet("suiet");
                setShowWalletOptions(false);
              }}
            >
              Use Suiet Wallet
            </SuietConnectButton>
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
  );
};

export default EnhancedWalletConnect;
