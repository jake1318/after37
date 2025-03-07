import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui.js/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Import the dapp-kit CSS - CRITICAL for wallet modal to display
import "@mysten/dapp-kit/dist/index.css";

import App from "./App";
import "./styles/main.scss";

// Initialize query client for data fetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Configure Sui client for mainnet
const networks = {
  mainnet: { url: getFullnodeUrl("mainnet") },
};

// Add wallet modal style fixes to document head
const injectModalStyles = () => {
  const styleElement = document.createElement("style");
  styleElement.textContent = `
    /* Make sure the wallet modal appears on top of everything */
    [data-radix-popper-content-wrapper] {
      z-index: 9999999 !important;
    }
    
    /* Modal overlay */
    .sui-wallet-modal-overlay {
      z-index: 9999998 !important;
    }
    
    /* Fix potential modal positioning issues */
    [data-radix-portal] {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 9999999;
    }
  `;
  document.head.appendChild(styleElement);
};

// Run style injection after initial render
setTimeout(injectModalStyles, 100);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networks} defaultNetwork="mainnet">
          <WalletProvider autoConnect={true}>
            <App />
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
