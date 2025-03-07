import { useContext } from "react";
import { WalletAddressContext } from "../context/WalletAddressContext";

export const useWalletAddress = () => {
  return useContext(WalletAddressContext);
};
