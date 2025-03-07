import React from "react";

interface LogoProps {
  size?: "small" | "medium" | "large";
}

const Logo: React.FC<LogoProps> = ({ size = "medium" }) => {
  const getSize = () => {
    switch (size) {
      case "small":
        return { width: "24px", height: "24px", fontSize: "16px" };
      case "large":
        return { width: "48px", height: "48px", fontSize: "28px" };
      default:
        return { width: "36px", height: "36px", fontSize: "22px" };
    }
  };

  const { width, height, fontSize } = getSize();

  return (
    <div className="logo">
      <div className="logo-icon">
        <svg
          width={width}
          height={height}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 36C27.9411 36 36 27.9411 36 18C36 8.05887 27.9411 0 18 0C8.05887 0 0 8.05887 0 18C0 27.9411 8.05887 36 18 36Z"
            fill="url(#paint0_radial)"
          />
          <path
            d="M25.5 11.25L18 6L10.5 11.25V21.75L18 27L25.5 21.75V11.25Z"
            stroke="#0DF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 27V21.75"
            stroke="#0DF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M25.5 11.25L18 16.5L10.5 11.25"
            stroke="#0DF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 16.5V21.75"
            stroke="#0DF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <radialGradient
              id="paint0_radial"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(18 18) rotate(90) scale(18)"
            >
              <stop stopColor="#14152B" />
              <stop offset="1" stopColor="#060714" />
            </radialGradient>
          </defs>
        </svg>
      </div>
      <div className="logo-text">
        SUI <span className="highlight">AFTERMATH</span>
      </div>

      <style jsx>{`
        .logo {
          display: flex;
          align-items: center;
        }

        .logo-icon {
          margin-right: 0.75rem;
          position: relative;
        }

        .logo-icon::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50%;
          box-shadow: 0 0 15px rgba(0, 221, 255, 0.5);
          filter: blur(5px);
          opacity: 0.7;
        }

        .logo-text {
          font-family: "Orbitron", sans-serif;
          font-weight: 700;
          font-size: ${fontSize};
          letter-spacing: 1px;
        }

        .highlight {
          background: linear-gradient(90deg, #0df, #f0c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default Logo;
