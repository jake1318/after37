import React from "react";
import { Routes, Route } from "react-router-dom";
import { WalletAddressProvider } from "./context/WalletAddressContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import SwapPage from "./pages/SwapPage";
import PoolsPage from "./pages/PoolsPage";
import NotFoundPage from "./pages/NotFoundPage";

// Current Date and Time: 2025-03-14 06:18:21
// Current User's Login: jake1318

const App: React.FC = () => {
  return (
    <WalletAddressProvider>
      <div className="app">
        <Header />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/swap" element={<SwapPage />} />
            <Route path="/pools" element={<PoolsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <Footer />
      </div>

      <style jsx>{`
        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #0a0b1a;
          color: #fff;
        }

        .app-main {
          flex: 1;
        }

        /* Global container styles */
        .container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        @media (max-width: 768px) {
          .container {
            padding: 0 1.5rem;
          }
        }
      `}</style>
    </WalletAddressProvider>
  );
};

export default App;
