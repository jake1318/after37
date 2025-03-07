import { ReactNode, useEffect } from "react";
import { WalletAddressProvider } from "../../context/WalletAddressContext";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  // Add futuristic cyberpunk terminal effects on page load
  useEffect(() => {
    const addNoiseEffect = () => {
      const glitchLines = document.createElement("div");
      glitchLines.className = "noise-effect";
      glitchLines.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0.05;
        z-index: 1000;
        pointer-events: none;
        background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAC6ElEQVR4nO2ZTYhNYRjHf9dkjDAzZvgYiQyNUiJ2tJi1jVKKxFKKbGQzRamZheJmQzZCyQLFSCmSvZRIIWGBwUz5SGZkZnj0OD1Hvefe65xz3nPvnJn/+jfve59znvM+7/P//88599wrMjMURIsAK4ENwFJgEVAT/PYdGASuA5eAG2Y2ObBRJ0iSDKwTgcPA7oSuV4EdZvYpkUFJ0yTVS7olaREj6SaQlrRbUiowz1dSk6T+CEMSoV/SZr+8yVQSJnXAbaA2hsww0AbcA14CX4FZwHxgGbApqA9jDFgNPJbELFARh9TMxoBDEb81Ze31ALgAVHpSJCkFtAKbI8RazdIEOrEFNAGdwPQQmRIdhhS5grfAnpCUA6wt4ZICiTGgwZMqVznWuzr4asosJeBWcCpyBfEZWBBi0lTGwoIsBS2Ax7R6oCoCYYzrnNiqy7I61BdBnHuWjSEb+FQORknaK6lH0nyP9u2SGiLm1Ukaz8b7DTwA6nOYpIFuYKLUq1VENf4HrC9nUChFHmUDrPFocxZ4W+J1q9U3wLYwZe5KGgq+d0haH1FJtyV9kzQkaVDSE0kdZnYzm4KZPZHUCxwJKmMa2G9m/UUssLTlqozf+TDaP7kAjIj5k+KcMAAS+VswVOv6YajGAEjE1yrb1oaVTVorZr2kstEiYBpQFWH8j2B9C6voo9jRJRNBcmYc992ANhmGoA3BFJIqo1TA3jI+gx32vnl4D5zOaL8jRGaK3if+PXLZzIaybiZlwMOE/VSWfVXQB1xOkkyhgvw9M3uTr3mGFJCnS7cBO8GHuJgiqQHYDiwH5hKc1cF5vw/oBu6a2eeuU58EXXwq+jj/bl4/g70CG4EaMzsP/PDkGQWuArfM7MeUhAWeAF5JypXrq6SrPqeJiKCGJM3NKHIvgFBScyF85XhB9gEPy1jsjiU5lhfdZgLnEpIZBs4Aw8UaXoqDqsrMOs3sl5mNAKeA48AX3/hJLuRxK2CrpDngbp8fgRdm9r3oi/h/4C915TIXVgJTpwAAAABJRU5ErkJggg==");
        background-repeat: repeat;
        animation: noise 0.2s infinite;
      `;

      document.body.appendChild(glitchLines);

      // Create CSS animation
      const style = document.createElement("style");
      style.innerHTML = `
        @keyframes noise {
          0% { background-position: 0 0; }
          10% { background-position: -5% -5%; }
          20% { background-position: -10% 5%; }
          30% { background-position: 5% -10%; }
          40% { background-position: -5% 15%; }
          50% { background-position: -10% 5%; }
          60% { background-position: 15% 0; }
          70% { background-position: 0% 10%; }
          80% { background-position: -15% 0; }
          90% { background-position: 10% 5%; }
          100% { background-position: 5% 0; }
        }
      `;
      document.head.appendChild(style);
    };

    const addScanlineEffect = () => {
      const scanlines = document.createElement("div");
      scanlines.className = "scanline-effect";
      scanlines.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0) 0%,
          rgba(0, 0, 0, 0) 50%,
          rgba(0, 0, 0, 0.02) 50%,
          rgba(0, 0, 0, 0) 100%
        );
        background-size: 100% 4px;
        pointer-events: none;
        z-index: 1001;
      `;
      document.body.appendChild(scanlines);
    };

    // Add effects
    addNoiseEffect();
    addScanlineEffect();

    // Clean up function to remove effects when component unmounts
    return () => {
      const noiseEffect = document.querySelector(".noise-effect");
      const scanlineEffect = document.querySelector(".scanline-effect");

      if (noiseEffect) {
        noiseEffect.remove();
      }

      if (scanlineEffect) {
        scanlineEffect.remove();
      }
    };
  }, []);

  return (
    <WalletAddressProvider>
      <div className="app-wrapper">
        <Header />
        <main className="main-content">{children}</main>
        <Footer />
      </div>
    </WalletAddressProvider>
  );
};

export default Layout;
