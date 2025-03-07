import React from "react";

interface LoadingStateProps {
  text?: string;
  size?: "small" | "medium" | "large";
}

const LoadingState: React.FC<LoadingStateProps> = ({
  text = "Loading...",
  size = "medium",
}) => {
  const getSize = () => {
    switch (size) {
      case "small":
        return { width: "20px", height: "20px" };
      case "large":
        return { width: "60px", height: "60px" };
      default:
        return { width: "40px", height: "40px" };
    }
  };

  const { width, height } = getSize();

  return (
    <div className="page-loading">
      <div className="loader" style={{ width, height }} />
      <div className="loading-text">{text}</div>

      <style jsx>{`
        .page-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 2rem;
        }

        .loader {
          border: 3px solid rgba(0, 221, 255, 0.3);
          border-radius: 50%;
          border-top: 3px solid #0df;
          animation: spin 1s infinite linear;
          margin-bottom: 1rem;
        }

        .loading-text {
          font-family: "Share Tech Mono", monospace;
          color: #9baacf;
          text-shadow: 0 0 5px rgba(0, 221, 255, 0.5);
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingState;
