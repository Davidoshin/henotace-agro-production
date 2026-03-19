import { useEffect, useState } from 'react';

interface LoadingSpinnerProps {
  message?: string;
  showTimer?: boolean;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  message = "Loading...", 
  showTimer = true,
  fullScreen = true 
}: LoadingSpinnerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const containerClass = fullScreen 
    ? "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    : "flex items-center justify-center py-12";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-4">
        {/* Curved SVG spinner with rounded ends */}
        <div className="relative w-16 h-16">
          {/* Spinning arc with rounded ends */}
          <svg 
            className="w-16 h-16 animate-spin" 
            viewBox="0 0 64 64" 
            fill="none"
          >
            {/* Background circle */}
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              className="text-primary/20"
            />
            {/* Animated arc with curved/rounded ends */}
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="120 176"
              className="text-primary"
            />
          </svg>
          {/* Center favicon */}
          <img 
            src="/favicon.png" 
            alt="Loading" 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 object-contain"
            onError={(e) => {
              // Fallback if favicon.png doesn't exist
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        
        {/* Loading message */}
        <p className="text-lg font-medium text-foreground">{message}</p>
        
        {/* Timer */}
        {showTimer && (
          <p className="text-sm text-muted-foreground">
            {formatTime(elapsedTime)}
          </p>
        )}
        
        {/* Loading hints for long waits */}
        {elapsedTime > 5 && elapsedTime < 15 && (
          <p className="text-xs text-muted-foreground animate-pulse">
            Fetching your data...
          </p>
        )}
        {elapsedTime >= 15 && elapsedTime < 30 && (
          <p className="text-xs text-muted-foreground animate-pulse">
            Almost there, please wait...
          </p>
        )}
        {elapsedTime >= 30 && (
          <p className="text-xs text-amber-600 animate-pulse">
            This is taking longer than usual. Please be patient.
          </p>
        )}
      </div>
    </div>
  );
}

// Inline loading spinner for cards/sections
export function InlineLoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex flex-col items-center gap-3">
        <svg 
          className="w-8 h-8 animate-spin" 
          viewBox="0 0 32 32" 
          fill="none"
        >
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="currentColor"
            strokeWidth="3"
            className="text-primary/20"
          />
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="60 88"
            className="text-primary"
          />
        </svg>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Skeleton loader for tables
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="h-10 bg-muted rounded flex-1"></div>
          <div className="h-10 bg-muted rounded w-24"></div>
          <div className="h-10 bg-muted rounded w-24"></div>
          <div className="h-10 bg-muted rounded w-20"></div>
        </div>
      ))}
    </div>
  );
}

// Skeleton loader for cards
export function CardSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4 border rounded-lg">
      <div className="h-4 bg-muted rounded w-3/4"></div>
      <div className="h-8 bg-muted rounded w-1/2"></div>
      <div className="h-3 bg-muted rounded w-1/3"></div>
    </div>
  );
}

// Grid of card skeletons
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// Button spinner for inline loading states (replaces Loader2 in buttons)
export function ButtonSpinner({ className = "" }: { className?: string }) {
  return (
    <svg 
      className={`w-4 h-4 animate-spin ${className}`}
      viewBox="0 0 16 16" 
      fill="none"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.2"
      />
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="25 38"
      />
    </svg>
  );
}

// Page loading spinner (for replacing full-page Loader2)
export function PageSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <svg 
        className="w-8 h-8 animate-spin text-primary" 
        viewBox="0 0 32 32" 
        fill="none"
      >
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke="currentColor"
          strokeWidth="3"
          className="text-primary/20"
        />
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="60 88"
          className="text-primary"
        />
      </svg>
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// Section spinner for loading content within cards/sections
export function SectionSpinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <svg 
        className="w-6 h-6 animate-spin text-primary" 
        viewBox="0 0 24 24" 
        fill="none"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary/20"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="44 66"
          className="text-primary"
        />
      </svg>
      {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
// Delayed loading overlay - shows fullscreen spinner after delay (default 2 seconds)
// Use for long-running operations where you want to show feedback only if it takes too long
export function DelayedLoadingOverlay({ 
  isLoading, 
  delay = 2000, 
  message = "Still loading..." 
}: { 
  isLoading: boolean; 
  delay?: number; 
  message?: string;
}) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let interval: NodeJS.Timeout | null = null;

    if (isLoading) {
      // Start counting immediately
      const startTime = Date.now();
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      
      // Show overlay after delay
      timer = setTimeout(() => {
        setShowOverlay(true);
      }, delay);
    } else {
      setShowOverlay(false);
      setElapsedTime(0);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [isLoading, delay]);

  if (!showOverlay || !isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-6 bg-card rounded-xl shadow-lg border">
        <div className="relative w-16 h-16">
          <svg 
            className="w-16 h-16 animate-spin" 
            viewBox="0 0 64 64" 
            fill="none"
          >
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              className="text-primary/20"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="120 176"
              className="text-primary"
            />
          </svg>
          <img 
            src="/favicon.png" 
            alt="Loading" 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        <p className="text-lg font-medium text-foreground">{message}</p>
        <p className="text-sm text-muted-foreground">{elapsedTime}s elapsed</p>
        <p className="text-xs text-muted-foreground animate-pulse">
          Please wait while we complete the operation...
        </p>
      </div>
    </div>
  );
}

// Saving overlay - shows immediately with custom message (for save operations >5 seconds)
export function SavingOverlay({ 
  isSaving, 
  delay = 5000,
  message = "Saving changes..." 
}: { 
  isSaving: boolean; 
  delay?: number;
  message?: string;
}) {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isSaving) {
      timer = setTimeout(() => {
        setShowOverlay(true);
      }, delay);
    } else {
      setShowOverlay(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isSaving, delay]);

  if (!showOverlay || !isSaving) return null;

  return (
    <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 p-6 bg-card rounded-xl shadow-lg border">
        <svg 
          className="w-12 h-12 animate-spin text-primary" 
          viewBox="0 0 48 48" 
          fill="none"
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            className="text-primary/20"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="85 126"
            className="text-primary"
          />
        </svg>
        <p className="text-lg font-medium text-foreground">{message}</p>
        <p className="text-xs text-muted-foreground animate-pulse">
          This is taking longer than usual...
        </p>
      </div>
    </div>
  );
}