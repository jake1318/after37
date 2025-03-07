import {
  ConnectButton,
  ConnectModal,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import React, { useState } from "react";

interface WalletConnectProps {
  className?: string;
  connectText?: string;
  buttonStyle?: React.CSSProperties;
  useModal?: boolean;
}

export function WalletConnect({
  className = "",
  connectText = "Connect Wallet",
  buttonStyle,
  useModal = true,
}: WalletConnectProps) {
  const currentAccount = useCurrentAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Format the address for display
  const formatAddress = (address?: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // If using simple connect button
  if (!useModal) {
    return (
      <ConnectButton
        connectText={connectText}
        className={className}
        style={buttonStyle}
      />
    );
  }

  // Using modal approach
  return (
    <ConnectModal
      open={isModalOpen}
      onOpenChange={setIsModalOpen}
      trigger={
        <button
          className={`wallet-connect-btn ${className}`}
          style={buttonStyle}
          onClick={() => !currentAccount && setIsModalOpen(true)}
        >
          {currentAccount ? formatAddress(currentAccount.address) : connectText}
        </button>
      }
    />
  );
}
