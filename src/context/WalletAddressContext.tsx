import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useWallet as useSuietWallet } from "@suiet/wallet-kit";

// Current datetime: 2025-03-14 20:11:21
// Current user: jake1318

// Create a context for wallet addresses
interface WalletAddressContextType {
  address: string | null;
  isConnected: boolean;
}

const WalletAddressContext = createContext<WalletAddressContextType>({
  address: null,
  isConnected: false,
});

// Custom hook to use the wallet address context
export const useWalletAddress = () => useContext(WalletAddressContext);

// Provider component to wrap around components that need access to wallet addresses
export const WalletAddressProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [address, setAddress] = useState<string | null>(null);
  const suietWallet = useSuietWallet();

  // Update address when wallet connection changes
  useEffect(() => {
    // Update the address whenever the wallet connection changes
    if (suietWallet.connected && suietWallet.account) {
      console.log(
        "WalletContext: Setting address to",
        suietWallet.account.address
      );
      setAddress(suietWallet.account.address);
    } else {
      console.log("WalletContext: No wallet connected, clearing address");
      setAddress(null);
    }
  }, [suietWallet.connected, suietWallet.account]);

  return (
    <WalletAddressContext.Provider value={{ address, isConnected: !!address }}>
      {children}
    </WalletAddressContext.Provider>
  );
};
