import React from "react";
import { Routes, Route } from "react-router-dom"; // Remove BrowserRouter import
import { WalletAddressProvider } from "./context/WalletAddressContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import SwapPage from "./pages/SwapPage";
import PoolsPage from "./pages/PoolsPage";
import NotFoundPage from "./pages/NotFoundPage";

const App: React.FC = () => {
  return (
    // Remove the <Router> wrapper since it's already provided in main.tsx
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
