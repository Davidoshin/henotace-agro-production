import { useState } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = "md", className = "", text }: LoadingSpinnerProps) {
  const [logoError, setLogoError] = useState(false);
  
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        {!logoError ? (
          <img
            src="/favicon.png"
            alt="Loading"
            className="w-full h-full object-contain animate-spin"
            onError={() => {
              setLogoError(true);
            }}
          />
        ) : (
          <div className={`${sizeClasses[size]} border-4 border-primary border-t-transparent rounded-full animate-spin`} />
        )}
      </div>
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
}

