import React, { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  className = "",
  ...props
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "btn-sm";
      case "lg":
        return "btn-lg";
      default:
        return "";
    }
  };

  return (
    <button
      className={`btn btn-${variant} ${getSizeClasses()} ${
        fullWidth ? "btn-block" : ""
      } ${loading ? "btn-loading" : ""} ${className}`}
      disabled={props.disabled || loading}
      {...props}
    >
      <span className="btn-content">
        {leftIcon && <span className="btn-icon left-icon">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="btn-icon right-icon">{rightIcon}</span>}
      </span>

      <style jsx>{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          font-family: "Orbitron", sans-serif;
          letter-spacing: 0.5px;
          min-height: 44px;
          border: 1px solid transparent;
        }

        .btn-content {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon {
          display: flex;
          align-items: center;
        }

        .left-icon {
          margin-right: 0.5rem;
        }

        .right-icon {
          margin-left: 0.5rem;
        }

        /* Size variants */
        .btn-sm {
          padding: 0.25rem 1rem;
          font-size: 0.875rem;
          min-height: 34px;
        }

        .btn-lg {
          padding: 0.75rem 2rem;
          font-size: 1.125rem;
          min-height: 54px;
        }

        /* Full width */
        .btn-block {
          width: 100%;
        }

        /* Loading state */
        .btn-loading {
          position: relative;
          pointer-events: none;
        }

        .btn-loading .btn-content {
          opacity: 0;
        }

        .btn-loading::after {
          content: "";
          position: absolute;
          left: calc(50% - 8px);
          top: calc(50% - 8px);
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 1s infinite linear;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        /* Button variants */
        .btn-primary {
          background-color: rgba(0, 221, 255, 0.1);
          border-color: #0df;
          color: #0df;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: rgba(0, 221, 255, 0.2);
          box-shadow: 0 0 15px rgba(0, 221, 255, 0.5);
          text-shadow: 0 0 5px #0df;
        }

        .btn-secondary {
          background-color: rgba(255, 0, 204, 0.1);
          border-color: #f0c;
          color: #f0c;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: rgba(255, 0, 204, 0.2);
          box-shadow: 0 0 15px rgba(255, 0, 204, 0.5);
          text-shadow: 0 0 5px #f0c;
        }

        .btn-tertiary {
          background-color: rgba(0, 255, 102, 0.1);
          border-color: #0f6;
          color: #0f6;
        }

        .btn-tertiary:hover:not(:disabled) {
          background-color: rgba(0, 255, 102, 0.2);
          box-shadow: 0 0 15px rgba(0, 255, 102, 0.5);
          text-shadow: 0 0 5px #0f6;
        }

        .btn-outline {
          background: transparent;
          border-color: rgba(255, 255, 255, 0.3);
          color: #fff;
        }

        .btn-outline:hover:not(:disabled) {
          border-color: #fff;
          background-color: rgba(255, 255, 255, 0.05);
        }

        .btn-ghost {
          background: transparent;
          border-color: transparent;
          color: #fff;
        }

        .btn-ghost:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.05);
        }

        /* Disabled state */
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </button>
  );
};

export default Button;
