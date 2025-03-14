import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { WalletProvider as SuietWalletProvider } from "@suiet/wallet-kit";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Import wallet kit styles
import "@suiet/wallet-kit/style.css"; // Add Suiet styles

import App from "./App";
import "./styles/main.scss";

// Current DateTime: 2025-03-14 06:15:50
// Current User: jake1318

// Initialize query client for data fetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Create and export a SUI client for use throughout the app
export const suiClient = new SuiClient({
  url: getFullnodeUrl("mainnet"),
});

// Add wallet modal style fixes to document head
const injectModalStyles = () => {
  const styleElement = document.createElement("style");
  styleElement.textContent = `
    /* Suiet wallet modal styles */
    .suiet-wallet-modal-overlay {
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
        <SuietWalletProvider>
          <App />
        </SuietWalletProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
