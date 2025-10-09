import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
      <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-center max-w-md mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} className="bg-gradient-primary hover:bg-gradient-primary/90">
          {action.label}
        </Button>
      )}
    </div>
  );
};
