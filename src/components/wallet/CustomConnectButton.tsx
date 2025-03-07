import { useState, useEffect } from "react";
import { ConnectModal, useCurrentAccount } from "@mysten/dapp-kit";
import { truncateAddress } from "../../utils/addressUtils";

export function CustomConnectButton() {
  const [isOpen, setIsOpen] = useState(false);
  const currentAccount = useCurrentAccount();

  // Force the modal to open when the button is clicked
  const handleOpenModal = () => {
    if (!currentAccount) {
      setIsOpen(true);

      // Log to help debug
      console.log("Opening wallet connect modal");

      // Force opening by inserting directly into DOM if needed
      setTimeout(() => {
        const modalElement = document.querySelector("[data-radix-portal]");
        if (!modalElement) {
          console.warn("Modal element not found in DOM");
        } else {
          console.log("Modal element found in DOM:", modalElement);
        }
      }, 100);
    }
  };

  // Close button handler
  const handleCloseModal = (isOpen: boolean) => {
    setIsOpen(isOpen);
    console.log("Modal visibility changed:", isOpen);
  };

  // Log when account changes
  useEffect(() => {
    console.log(
      "Account state changed:",
      currentAccount ? "Connected" : "Disconnected"
    );
  }, [currentAccount]);

  return (
    <div className="wallet-connect-wrapper">
      <button className="custom-connect-button" onClick={handleOpenModal}>
        {currentAccount
          ? truncateAddress(currentAccount.address)
          : "Connect Wallet"}
      </button>

      {/* Modal with explicit z-index */}
      <ConnectModal open={isOpen} onOpenChange={handleCloseModal} />

      <style>{`
        .wallet-connect-wrapper {
          position: relative;
          z-index: 1000;
        }
        
        .custom-connect-button {
          background-color: rgba(0, 221, 255, 0.1);
          border: 1px solid rgba(0, 221, 255, 0.3);
          color: #0df;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .custom-connect-button:hover {
          background-color: rgba(0, 221, 255, 0.2);
          box-shadow: 0 0 10px rgba(0, 221, 255, 0.3);
        }

        /* Apply higher z-index to modal */
        :global([data-radix-portal]) {
          z-index: 99999;
          position: relative;
        }
      `}</style>
    </div>
  );
}
