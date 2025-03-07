import React, { createContext, useState, useEffect, ReactNode } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface WalletAddressContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export const WalletAddressContext = createContext<WalletAddressContextType>({
  address: null,
  isConnected: false,
  isConnecting: false,
  error: null,
});

interface WalletAddressProviderProps {
  children: ReactNode;
}

export const WalletAddressProvider: React.FC<WalletAddressProviderProps> = ({
  children,
}) => {
  const currentAccount = useCurrentAccount();
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentAccount) {
      setAddress(currentAccount.address);
      setError(null);
    } else {
      setAddress(null);
    }
  }, [currentAccount]);

  const value = {
    address,
    isConnected: !!address,
    isConnecting,
    error,
  };

  return (
    <WalletAddressContext.Provider value={value}>
      {children}
    </WalletAddressContext.Provider>
  );
};
