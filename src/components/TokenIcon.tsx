import { useState } from "react";

interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
  fallbackColor?: string;
}

export function TokenIcon({
  symbol,
  size = 24,
  className = "",
  fallbackColor = "#0df",
}: TokenIconProps) {
  const [hasError, setHasError] = useState(false);

  // Create a simple text token from symbol
  const getInitials = (symbol: string) => {
    symbol = symbol || "UNKNOWN";
    return symbol.substring(0, 2).toUpperCase();
  };

  // Create a deterministic color based on symbol string
  const getColorFromSymbol = (symbol: string) => {
    if (fallbackColor) return fallbackColor;

    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += ("00" + value.toString(16)).substring(-2);
    }

    return color;
  };

  // Try different token icon URLs
  const getTokenIconUrls = (symbol: string) => {
    const clean = (symbol || "").toLowerCase();
    return [
      `https://sui-icons.vercel.app/coins/${clean}.png`,
      `/tokens/${clean}.png`,
      `/images/tokens/${clean}.png`,
    ];
  };

  const iconUrls = getTokenIconUrls(symbol);

  if (hasError) {
    // Render fallback text-based icon
    return (
      <div
        className={`token-icon-fallback ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: getColorFromSymbol(symbol),
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.4,
          fontWeight: "bold",
          color: "white",
        }}
      >
        {getInitials(symbol)}
      </div>
    );
  }

  return (
    <img
      src={iconUrls[0]}
      alt={symbol}
      className={`token-icon ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        backgroundColor: "rgba(10, 11, 26, 0.5)",
      }}
      onError={() => setHasError(true)}
    />
  );
}
