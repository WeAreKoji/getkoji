import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EnhancedEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  tips?: string[];
}

export const EnhancedEmptyState = ({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  tips,
}: EnhancedEmptyStateProps) => {
  return (
    <Card className="p-8">
      <div className="max-w-md mx-auto text-center">
        <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
          <Icon className="w-12 h-12 text-primary" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6">{description}</p>

        {(primaryAction || secondaryAction) && (
          <div className="flex gap-3 justify-center mb-6">
            {primaryAction && (
              <Button onClick={primaryAction.onClick} size="lg">
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button onClick={secondaryAction.onClick} variant="outline" size="lg">
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}

        {tips && tips.length > 0 && (
          <div className="mt-6 p-4 bg-muted rounded-lg text-left">
            <p className="font-medium mb-2 text-center">Getting Started Tips:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {tips.map((tip, index) => (
                <li key={index}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
};
