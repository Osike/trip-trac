import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const LoadingState = ({ 
  message = "Loading...", 
  className,
  size = "md" 
}: LoadingStateProps) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center py-8", className)}>
      <Loader2 className={cn(sizeClasses[size], "text-primary animate-spin mb-4")} />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
};
